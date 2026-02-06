from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """カスタムユーザーモデル"""
    
    USER_TYPE_CHOICES = [
        ('adopter', '飼い主希望者'),
        ('shelter', '保護団体スタッフ'),
        ('admin', '管理者'),
    ]
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='adopter',
        verbose_name='ユーザー種別'
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        verbose_name='電話番号',
        help_text='国際番号対応のため20文字まで'
    )
    address = models.TextField(
        blank=True,
        verbose_name='住所'
    )
    profile_image = models.ImageField(
        upload_to='profiles/',
        blank=True,
        null=True,
        verbose_name='プロフィール画像'
    )
    bio = models.TextField(
        blank=True,
        verbose_name='自己紹介'
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
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"
