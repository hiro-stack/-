from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'created_at']
    list_filter = ['user_type', 'is_staff', 'created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('追加情報', {'fields': ('user_type', 'phone_number', 'address', 'profile_image', 'bio')}),
    )
