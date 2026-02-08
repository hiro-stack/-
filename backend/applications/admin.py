from django.contrib import admin
from .models import Application, ApplicationEvent, Message
from shelters.models import ShelterUser


class ApplicationEventInline(admin.TabularInline):
    """応募イベントインライン（読み取り専用）"""
    model = ApplicationEvent
    extra = 0
    can_delete = False
    fields = ['event_type', 'actor_type', 'actor', 'from_status', 'to_status', 'note', 'created_at']
    readonly_fields = ['event_type', 'actor_type', 'actor', 'from_status', 'to_status', 'note', 'created_at']
    
    def has_add_permission(self, request, obj=None):
        """イベントは自動生成のみ、手動追加不可"""
        return False


class MessageInline(admin.TabularInline):
    """メッセージインライン"""
    model = Message
    extra = 0
    fields = ['sender', 'sender_type', 'content', 'read_at', 'created_at']
    readonly_fields = ['sender_type', 'created_at']


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    # full_name を削除
    list_display = ['cat', 'applicant', 'shelter', 'status', 'applied_at']
    # has_experience を削除
    list_filter = ['status', 'applied_at']
    # full_name を削除
    search_fields = ['applicant__username', 'cat__name']
    inlines = [ApplicationEventInline, MessageInline]
    readonly_fields = ['applied_at', 'updated_at']
    
    fieldsets = (
        ('基本情報', {
            'fields': ('cat', 'applicant', 'shelter', 'status', 'message')
        }),
        ('同意事項', {
            'fields': (
                'term_agreement', 'lifelong_care_agreement', 
                'spay_neuter_agreement', 'medical_cost_understanding',
                'cafe_data_sharing_consent'
            )
        }),
        ('追加情報', {
            'fields': (
                'income_status', 'emergency_contact_available', 
                'family_consent', 'allergy_status'
            )
        }),
        ('その他', {
            'fields': ('applied_at', 'updated_at')
        }),
    )
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の応募のみ表示"""
        qs = super().get_queryset(request)
        
        # 管理者は全て表示
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        # 団体ユーザーは自団体の応募のみ
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(shelter_id__in=shelter_ids)
        
        # 一般ユーザー（応募者）は自分の応募のみ
        if request.user.user_type == 'adopter':
            return qs.filter(applicant=request.user)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """追加権限：管理者と一般ユーザーのみ"""
        if request.user.is_superuser or request.user.user_type in ['admin', 'adopter']:
            return True
        return False
    
    def has_change_permission(self, request, obj=None):
        """編集権限：管理者、応募者本人、所属団体のスタッフ"""
        if request.user.is_superuser or request.user.user_type == 'admin':
            return True
        
        if obj:
            # 応募者本人
            if obj.applicant == request.user:
                return True
            
            # 団体スタッフ
            if request.user.user_type == 'shelter':
                return ShelterUser.objects.filter(
                    shelter=obj.shelter,
                    user=request.user,
                    is_active=True
                ).exists()
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除権限：管理者のみ"""
        return request.user.is_superuser or request.user.user_type == 'admin'


@admin.register(ApplicationEvent)
class ApplicationEventAdmin(admin.ModelAdmin):
    list_display = ['application', 'event_type', 'from_status', 'to_status', 'actor_type', 'actor', 'created_at']
    list_filter = ['event_type', 'actor_type', 'created_at']
    search_fields = ['application__applicant__username', 'application__cat__name', 'note']
    readonly_fields = ['application', 'event_type', 'actor_type', 'actor', 'from_status', 'to_status', 'note', 'created_at']
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の応募イベントのみ表示"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(application__shelter_id__in=shelter_ids)
        
        if request.user.user_type == 'adopter':
            return qs.filter(application__applicant=request.user)
        
        return qs.none()
    
    def has_add_permission(self, request):
        """イベントは自動生成のみ、手動追加不可"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """イベントは編集不可（監査ログのため）"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """削除権限：管理者のみ（緊急時のみ）"""
        return request.user.is_superuser


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['application', 'sender', 'sender_type', 'content_preview', 'created_at', 'read_at']
    list_filter = ['sender_type', 'created_at']
    search_fields = ['content', 'sender__username']
    readonly_fields = ['created_at', 'read_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'メッセージ'
    
    def get_queryset(self, request):
        """団体ユーザーは自団体の応募メッセージのみ表示"""
        qs = super().get_queryset(request)
        
        if request.user.is_superuser or request.user.user_type == 'admin':
            return qs
        
        if request.user.user_type == 'shelter':
            shelter_ids = ShelterUser.objects.filter(
                user=request.user,
                is_active=True
            ).values_list('shelter_id', flat=True)
            return qs.filter(application__shelter_id__in=shelter_ids)
        
        if request.user.user_type == 'adopter':
            return qs.filter(application__applicant=request.user)
        
        return qs.none()
    
    def save_model(self, request, obj, form, change):
        """sender_type を自動設定"""
        if not change:
            # 新規作成時、sender_type を自動設定
            if obj.sender.user_type == 'adopter':
                obj.sender_type = 'user'
            elif obj.sender.user_type == 'shelter':
                obj.sender_type = 'shelter'
            elif obj.sender.user_type == 'admin':
                obj.sender_type = 'admin'
        
        super().save_model(request, obj, form, change)
