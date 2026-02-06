from django.contrib import admin
from .models import Shelter, ShelterUser


class ShelterUserInline(admin.TabularInline):
    """団体メンバーインライン"""
    model = ShelterUser
    extra = 1
    fields = ['user', 'role', 'is_active', 'joined_at']
    readonly_fields = ['joined_at']


@admin.register(Shelter)
class ShelterAdmin(admin.ModelAdmin):
    list_display = ['name', 'representative', 'contact_info', 'created_at']
    search_fields = ['name', 'representative', 'registration_number']
    inlines = [ShelterUserInline]
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """団体ユーザーは自団体のみ表示"""
        qs = super().get_queryset(request)
        
        # 管理者は全て表示
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        # 団体ユーザーは自団体のみ
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(id__in=shelter_ids)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """追加権限：管理者のみ"""
        return request.user.is_superuser or request.user.user_type == 'admin'
    
    def has_change_permission(self, request, obj=None):
        """編集権限：管理者と所属団体の管理者"""
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        
        if obj and request.user.user_type == 'shelter':
            # 自団体の管理者のみ編集可能
            return ShelterUser.objects.filter(
                shelter=obj,
                user=request.user,
                is_active=True,
                role='admin'
            ).exists()
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除権限：管理者のみ"""
        return request.user.is_superuser or request.user.user_type == 'admin'


@admin.register(ShelterUser)
class ShelterUserAdmin(admin.ModelAdmin):
    list_display = ['shelter', 'user', 'role', 'is_active', 'joined_at']
    list_filter = ['role', 'is_active']
    search_fields = ['shelter__name', 'user__username']
    readonly_fields = ['joined_at']
    
    def get_queryset(self, request):
        """団体ユーザーは自団体のメンバーのみ表示"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(shelter_id__in=shelter_ids)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """追加権限：管理者と団体管理者"""
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        
        # 団体管理者は自団体のメンバーを追加可能
        if request.user.user_type == 'shelter':
            return ShelterUser.objects.filter(
                user=request.user,
                is_active=True,
                role='admin'
            ).exists()
        
        return False
    
    def has_change_permission(self, request, obj=None):
        """編集権限：管理者と所属団体の管理者"""
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        
        if obj and request.user.user_type == 'shelter':
            # 自団体の管理者のみ編集可能
            return ShelterUser.objects.filter(
                shelter=obj.shelter,
                user=request.user,
                is_active=True,
                role='admin'
            ).exists()
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除権限：編集権限と同じ"""
        return self.has_change_permission(request, obj)
