from django.db import models
from django.contrib.auth import get_user_model
from shelters.models import Shelter

User = get_user_model()


class Cat(models.Model):
    """保護猫モデル"""
    
    GENDER_CHOICES = [
        ('male', 'オス'),
        ('female', 'メス'),
        ('unknown', '不明'),
    ]
    
    SIZE_CHOICES = [
        ('small', '小型'),
        ('medium', '中型'),
        ('large', '大型'),
    ]
    
    STATUS_CHOICES = [
        ('open', '募集中'),
        ('paused', '一時停止'),
        ('in_review', '審査中'),
        ('trial', 'トライアル中'),
        ('adopted', '譲渡済み'),
    ]
    
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name='cats',
        verbose_name='保護団体'
    )
    name = models.CharField(
        max_length=100,
        verbose_name='名前'
    )
    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        verbose_name='性別'
    )
    age_years = models.IntegerField(
        default=0,
        verbose_name='年齢（年）'
    )
    age_months = models.IntegerField(
        default=0,
        verbose_name='年齢（月）'
    )
    breed = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='品種'
    )
    size = models.CharField(
        max_length=10,
        choices=SIZE_CHOICES,
        default='medium',
        verbose_name='体格'
    )
    color = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='毛色'
    )
    personality = models.TextField(
        verbose_name='性格'
    )
    health_status = models.TextField(
        verbose_name='健康状態'
    )
    vaccination = models.BooleanField(
        default=False,
        verbose_name='ワクチン接種済み'
    )
    neutered = models.BooleanField(
        default=False,
        verbose_name='去勢・避妊済み'
    )
    description = models.TextField(
        verbose_name='説明'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='open',
        verbose_name='募集状態'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='登録日時'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='更新日時'
    )
    
    class Meta:
        verbose_name = '保護猫'
        verbose_name_plural = '保護猫'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.get_gender_display()})"
    
    def clean(self):
        """年齢の整合性チェック"""
        from django.core.exceptions import ValidationError
        
        # age_months は 0〜11 の範囲
        if self.age_months < 0 or self.age_months > 11:
            raise ValidationError({
                'age_months': '月齢は0〜11の範囲で入力してください。'
            })
    
    def save(self, *args, **kwargs):
        """保存前にバリデーションを実行"""
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def primary_image_url(self):
        """メイン画像URLを返す（無ければプレースホルダ）"""
        from django.conf import settings
        
        # メイン画像を取得（複数ある場合は sort_order, created_at で決定）
        primary_image = self.images.filter(is_primary=True).order_by('sort_order', 'created_at').first()
        if primary_image and primary_image.image and hasattr(primary_image.image, 'url'):
            return primary_image.image.url
        
        # メイン画像が無い場合はプレースホルダ
        return settings.STATIC_URL + 'images/placeholder_cat.svg'
    
    @property
    def sub_images(self):
        """サブ画像一覧を返す（メイン以外、並び順付き）"""
        return self.images.filter(is_primary=False).order_by('sort_order', 'created_at')
    
    @property
    def sub_videos(self):
        """サブ動画一覧を返す（並び順付き）"""
        return self.videos.all().order_by('sort_order', 'created_at')


class CatImage(models.Model):
    """保護猫画像モデル"""
    
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='保護猫'
    )
    image = models.ImageField(
        upload_to='cats/',
        verbose_name='画像'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='メイン画像'
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='表示順'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='キャプション'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='アップロード日時'
    )
    
    class Meta:
        verbose_name = '保護猫画像'
        verbose_name_plural = '保護猫画像'
        ordering = ['-is_primary', 'sort_order', 'created_at']
        indexes = [
            models.Index(fields=['cat', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.cat.name}の画像"
    
    def save(self, *args, **kwargs):
        """メイン画像を1枚に制限（真の完全保証：親ロック + トランザクション）
        
        運用方針：
        - メイン画像が0件になることを許容（プレースホルダで対応）
        - is_primary=False に変更した場合、他の画像を自動的にメインにしない
        """
        from django.db import transaction
        
        # バリデーション実行（一貫性のため）
        self.full_clean()
        
        if self.is_primary:
            # 親（Cat）をロックして競合を完全防止
            with transaction.atomic():
                # 親行を必ずロックできる（0件問題を回避）
                Cat.objects.select_for_update().get(pk=self.cat_id)
                
                # 同じ猫の他の画像のメインフラグを外す（IDベースで安定）
                CatImage.objects.filter(
                    cat_id=self.cat_id,
                    is_primary=True
                ).exclude(pk=self.pk).update(is_primary=False)
                
                # 自分自身の保存も同一トランザクション内で実行
                super().save(*args, **kwargs)
        else:
            # メイン画像でない場合は通常保存
            # 注意: メイン画像が0件になる可能性あり（プレースホルダで対応）
            super().save(*args, **kwargs)


class CatVideo(models.Model):
    """保護猫動画モデル"""
    
    cat = models.ForeignKey(
        Cat,
        on_delete=models.CASCADE,
        related_name='videos',
        verbose_name='保護猫'
    )
    video = models.FileField(
        upload_to='cats/videos/',
        verbose_name='動画ファイル'
    )
    sort_order = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='表示順'
    )
    caption = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='キャプション'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='アップロード日時'
    )
    
    class Meta:
        verbose_name = '保護猫動画'
        verbose_name_plural = '保護猫動画'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['cat', 'sort_order']),
        ]
    
    def __str__(self):
        return f"{self.cat.name}の動画"
