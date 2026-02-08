from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ApplicantProfile


class ApplicantProfileInline(admin.StackedInline):
    """ユーザー詳細画面にプロフィールを埋め込む"""
    model = ApplicantProfile
    can_delete = False
    verbose_name_plural = '里親希望者プロフィール'
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'user_type', 'created_at']
    list_filter = ['user_type', 'is_staff', 'created_at']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('追加情報', {'fields': ('user_type', 'phone_number', 'address', 'profile_image', 'bio')}),
    )
    inlines = [ApplicantProfileInline]


@admin.register(ApplicantProfile)
class ApplicantProfileAdmin(admin.ModelAdmin):
    """プロフィール単独管理画面"""
    list_display = ['user', 'age', 'gender', 'residence_area', 'has_indoors_agreement']
    list_filter = ['gender', 'housing_type', 'pet_allowed']
    search_fields = ['user__username', 'user__email', 'residence_area']
    
    def has_indoors_agreement(self, obj):
        return obj.indoors_agreement
    has_indoors_agreement.boolean = True
    has_indoors_agreement.short_description = '室内飼い同意'
