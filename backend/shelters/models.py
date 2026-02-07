from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

User = get_user_model()


class Shelter(models.Model):
    """保護団体モデル（独立）"""
    
    name = models.CharField(
        max_length=200,
        verbose_name='団体名'
    )
    representative = models.CharField(
        max_length=100,
        verbose_name='代表者名'
    )
    website_url = models.URLField(
        blank=True,
        verbose_name='公式サイトURL'
    )
    address = models.TextField(
        verbose_name='住所'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='電話番号',
        help_text='例: 03-1234-5678'
    )
    email = models.EmailField(
        blank=True,
        verbose_name='メールアドレス',
        help_text='例: info@example.com'
    )
    registration_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='登録番号'
    )
    description = models.TextField(
        blank=True,
        verbose_name='団体説明'
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
        verbose_name = '保護団体'
        verbose_name_plural = '保護団体'
        ordering = ['name']
    
    def clean(self):
        """電話番号またはメールアドレスの少なくとも一方が必須"""
        super().clean()
        if not self.phone and not self.email:
            raise ValidationError(
                '電話番号またはメールアドレスのどちらか一方は必須です。'
            )
    
    def __str__(self):
        return self.name


class ShelterUser(models.Model):
    """保護団体とユーザーの紐付け（多対多）"""
    
    ROLE_CHOICES = [
        ('admin', '管理者'),
        ('staff', 'スタッフ'),
        ('volunteer', 'ボランティア'),
    ]
    
    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name='shelter_users',
        verbose_name='保護団体'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shelter_memberships',
        verbose_name='ユーザー'
    )
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='staff',
        verbose_name='役割'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='有効'
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='参加日時'
    )
    
    class Meta:
        verbose_name = '保護団体メンバー'
        verbose_name_plural = '保護団体メンバー'
        constraints = [
            models.UniqueConstraint(
                fields=['shelter', 'user'],
                name='unique_shelter_user'
            )
        ]
        indexes = [
            models.Index(fields=['shelter']),
            models.Index(fields=['user']),
        ]
    
    def __str__(self):
        return f"{self.shelter.name} - {self.user.username} ({self.get_role_display()})"
