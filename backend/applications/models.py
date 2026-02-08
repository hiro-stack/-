from django.db import models
from django.core.validators import MaxValueValidator
from django.contrib.auth import get_user_model
from cats.models import Cat
from shelters.models import Shelter

User = get_user_model()


class Application(models.Model):
    """応募モデル"""
    
    STATUS_CHOICES = [
        ('pending', '新着（未確認）'),
        ('reviewing', '審査・面談中'),
        ('trial', 'トライアル中'),
        ('accepted', '譲渡完了'),
        ('rejected', 'お断り'),
        ('cancelled', 'キャンセル済み'),
    ]
    
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='保護猫'
    )
    applicant = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name='応募者'
    )
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name='received_applications',
        verbose_name='保護団体',
        help_text='猫の所属団体（検索性向上のため冗長保持）'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='ステータス'
    )
    message = models.TextField(
        blank=True,
        verbose_name='応募時メッセージ'
    )
    
    # --- C. 応募時のみ（団体提出用・非公開） ---
    
    # 同意事項
    term_agreement = models.BooleanField(
        default=False,
        verbose_name='利用規約・個人情報保護方針への同意'
    )
    
    lifelong_care_agreement = models.BooleanField(
        default=False,
        verbose_name='終生飼養への同意'
    )
    
    spay_neuter_agreement = models.BooleanField(
        default=False,
        verbose_name='不妊去勢への同意'
    )
    
    medical_cost_understanding = models.BooleanField(
        default=False,
        verbose_name='医療費負担への理解'
    )
    
    # 追加情報
    INCOME_STATUS_CHOICES = [
        ('stable', '安定'),
        ('unstable', 'やや不安定'),
        # 必要に応じて追加
    ]
    income_status = models.CharField(
        max_length=20,
        choices=INCOME_STATUS_CHOICES,
        default='stable',
        verbose_name='収入状況'
    )
    
    emergency_contact_available = models.BooleanField(
        default=False,
        verbose_name='緊急時の預け先の有無'
    )
    
    family_consent = models.BooleanField(
        default=False,
        verbose_name='家族全員の同意'
    )
    
    allergy_status = models.BooleanField(
        default=False,
        verbose_name='アレルギー有無',
        help_text='家族含む'
    )
    
    cafe_data_sharing_consent = models.BooleanField(
        default=False,
        verbose_name='カフェへの情報提供同意'
    )
    
    applied_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='応募日時'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )

    # 履歴の非表示・アーカイブ用
    is_hidden_by_applicant = models.BooleanField(
        default=False,
        verbose_name='応募者側で非表示'
    )
    is_hidden_by_shelter = models.BooleanField(
        default=False,
        verbose_name='団体側で非表示'
    )
    
    class Meta:
        verbose_name = '応募'
        verbose_name_plural = '応募'
        ordering = ['-applied_at']
        # MySQL does not support conditional unique constraints.
        # Uniqueness for active applications will be enforced in application logic (Serializer/View).
        # constraints = [
        #     models.UniqueConstraint(
        #         fields=['cat', 'applicant'],
        #         condition=models.Q(status__in=['pending', 'reviewing', 'accepted']),
        #         name='unique_active_application'
        #     )
        # ]
        indexes = [
            models.Index(fields=['applicant']),
            models.Index(fields=['cat']),
            models.Index(fields=['shelter']),
            models.Index(fields=['status']),
            models.Index(fields=['cat', 'status']),
            models.Index(fields=['shelter', 'status']),
        ]
    
    def __str__(self):
        return f"{self.applicant.username} → {self.cat.name}"
    
    def clean(self):
        """整合性チェック"""
        from django.core.exceptions import ValidationError
        
        # cat.shelter と application.shelter の一致をチェック
        if self.cat_id and self.shelter_id:
            if self.shelter_id != self.cat.shelter_id:
                raise ValidationError({
                    'shelter': 'Application.shelter must match Cat.shelter'
                })
    
    def save(self, *args, **kwargs):
        # 新規作成時にshelterを自動設定
        is_new = not self.pk
        if is_new and not self.shelter_id and self.cat_id:
            self.shelter = self.cat.shelter
        
        # 保存前にバリデーション実行
        self.full_clean()
        
        # ステータス変更の検知
        old_status = None
        if not is_new:
            old_status = Application.objects.get(pk=self.pk).status
            
        super().save(*args, **kwargs)
        
        # 猫のステータス同期
        if old_status != self.status:
            self.sync_cat_status()

    def sync_cat_status(self):
        """応募状況に応じて猫のステータスを更新する"""
        cat = self.cat
        
        # 1. 誰かが成立(accepted)していたら「譲渡済み」
        if Application.objects.filter(cat=cat, status='accepted').exists():
            cat.status = 'adopted'
        # 2. 誰かがトライアル中(trial)なら「トライアル中」
        elif Application.objects.filter(cat=cat, status='trial').exists():
            cat.status = 'trial'
        # 3. 誰かが審査中(reviewing)なら「審査中」
        elif Application.objects.filter(cat=cat, status='reviewing').exists():
            cat.status = 'in_review'
        # 4. それ以外で、もし現在が「不承認」や「キャンセル」になった結果なら「募集中」に戻す
        # (ただし、明示的に一時停止(paused)にされている場合は維持したいかもしれないが、
        #  基本フローとしては応募が無くなれば自動的に「募集中」に戻るのが親切)
        elif self.status in ['rejected', 'cancelled']:
            # 他に動いている応募がないか最終確認
            if not Application.objects.filter(cat=cat, status__in=['pending', 'reviewing', 'trial']).exists():
                cat.status = 'open'
        
        cat.save()


class ApplicationEvent(models.Model):
    """応募履歴ログモデル"""
    
    EVENT_TYPE_CHOICES = [
        ('status_changed', 'ステータス変更'),
        ('note', 'メモ'),
        ('system', 'システム'),
    ]
    
    ACTOR_TYPE_CHOICES = [
        ('user', 'ユーザー'),
        ('shelter', '保護団体'),
        ('admin', '管理者'),
        ('system', 'システム'),
    ]
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='応募'
    )
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        verbose_name='イベント種別'
    )
    from_status = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=Application.STATUS_CHOICES,
        verbose_name='変更前ステータス'
    )
    to_status = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        choices=Application.STATUS_CHOICES,
        verbose_name='変更後ステータス'
    )
    actor_type = models.CharField(
        max_length=20,
        choices=ACTOR_TYPE_CHOICES,
        verbose_name='実行者種別'
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='application_events',
        verbose_name='実行者',
        help_text='システムイベントの場合はNULL'
    )
    note = models.TextField(
        blank=True,
        verbose_name='メモ'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='発生日時'
    )
    
    class Meta:
        verbose_name = '応募イベント'
        verbose_name_plural = '応募イベント'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['created_at']),
            models.Index(fields=['actor']),
        ]
    
    def __str__(self):
        return f"{self.application} - {self.get_event_type_display()}"


class Message(models.Model):
    """メッセージモデル"""
    
    SENDER_TYPE_CHOICES = [
        ('user', 'ユーザー'),
        ('shelter', '保護団体'),
        ('admin', '管理者'),
    ]
    
    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name='応募'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name='送信者'
    )
    sender_type = models.CharField(
        max_length=20,
        choices=SENDER_TYPE_CHOICES,
        verbose_name='送信者種別'
    )
    content = models.TextField(
        verbose_name='メッセージ内容'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='送信日時'
    )
    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='既読日時'
    )
    
    class Meta:
        verbose_name = 'メッセージ'
        verbose_name_plural = 'メッセージ'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['application']),
            models.Index(fields=['created_at']),
            models.Index(fields=['sender']),
        ]
    
    @property
    def is_read(self):
        """既読かどうかを判定（read_atから派生）"""
        return self.read_at is not None
    
    def clean(self):
        """sender_type と sender.user_type の整合性をチェック"""
        from django.core.exceptions import ValidationError
        
        if self.sender_id and self.sender_type:
            # sender.user_type と sender_type の対応をチェック
            expected_mapping = {
                'adopter': 'user',
                'shelter': 'shelter',
                'admin': 'admin',
            }
            expected_sender_type = expected_mapping.get(self.sender.user_type)

            # 緩和：shelterユーザーは立場に応じて 'shelter' または 'user' のどちらでも送信可能とする
            # (例：保護団体スタッフが他団体の猫に応募した場合は 'user' になる)
            if self.sender.user_type == 'shelter':
                if self.sender_type not in ['shelter', 'user']:
                    raise ValidationError({
                        'sender_type': 'Shelter users must send as "shelter" or "user"'
                    })
            elif expected_sender_type and self.sender_type != expected_sender_type:
                raise ValidationError({
                    'sender_type': f'sender_type must be "{expected_sender_type}" for user_type "{self.sender.user_type}"'
                })
    
    def save(self, *args, **kwargs):
        # 保存前にバリデーション実行
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
