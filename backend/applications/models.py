from django.db import models
from django.core.validators import MaxValueValidator
from django.contrib.auth import get_user_model
from cats.models import Cat
from shelters.models import Shelter

User = get_user_model()


class Application(models.Model):
    """応募モデル"""
    
    STATUS_CHOICES = [
        ('pending', '応募直後'),
        ('reviewing', '確認/面談調整中'),
        ('accepted', '成立'),
        ('rejected', '不成立'),
        ('cancelled', 'キャンセル'),
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
    
    # 応募者情報
    full_name = models.CharField(
        max_length=100,
        verbose_name='氏名'
    )
    age = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(120)],
        verbose_name='年齢'
    )
    occupation = models.CharField(
        max_length=100,
        verbose_name='職業'
    )
    phone_number = models.CharField(
        max_length=20,
        verbose_name='電話番号'
    )
    address = models.TextField(
        verbose_name='住所'
    )
    
    # 飼育環境
    housing_type = models.CharField(
        max_length=100,
        verbose_name='住居タイプ'
    )
    has_garden = models.BooleanField(
        default=False,
        verbose_name='庭の有無'
    )
    family_members = models.PositiveSmallIntegerField(
        validators=[MaxValueValidator(20)],
        verbose_name='家族構成（人数）'
    )
    has_other_pets = models.BooleanField(
        default=False,
        verbose_name='他のペットの有無'
    )
    other_pets_description = models.TextField(
        blank=True,
        verbose_name='他のペットの詳細'
    )
    
    # 飼育経験
    has_experience = models.BooleanField(
        default=False,
        verbose_name='飼育経験の有無'
    )
    experience_description = models.TextField(
        blank=True,
        verbose_name='飼育経験の詳細'
    )
    
    # その他
    motivation = models.TextField(
        verbose_name='応募動機'
    )
    additional_notes = models.TextField(
        blank=True,
        verbose_name='その他・備考'
    )
    
    applied_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='応募日時'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )
    
    class Meta:
        verbose_name = '応募'
        verbose_name_plural = '応募'
        ordering = ['-applied_at']
        # unique_together を削除して再応募を許可
        # 代わりに有効応募のみユニークにする制約を追加
        constraints = [
            models.UniqueConstraint(
                fields=['cat', 'applicant'],
                condition=models.Q(status__in=['pending', 'reviewing', 'accepted']),
                name='unique_active_application'
            )
        ]
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
        if not self.pk and not self.shelter_id:
            self.shelter = self.cat.shelter
        # 保存前にバリデーション実行
        self.full_clean()
        super().save(*args, **kwargs)


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
            
            if expected_sender_type and self.sender_type != expected_sender_type:
                raise ValidationError({
                    'sender_type': f'sender_type must be "{expected_sender_type}" for user_type "{self.sender.user_type}"'
                })
    
    def save(self, *args, **kwargs):
        # 保存前にバリデーション実行
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
