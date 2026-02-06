"""カスタム許可クラス"""
from rest_framework import permissions


class IsShelterStaff(permissions.BasePermission):
    """保護団体スタッフのみ許可"""
    
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.user_type == 'shelter'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """オブジェクトの所有者のみ編集可能、他は閲覧のみ"""
    
    def has_object_permission(self, request, view, obj):
        # 閲覧は誰でもOK
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 編集は所有者のみ
        return obj.user == request.user


class IsShelterOwner(permissions.BasePermission):
    """猫の所属団体のスタッフのみ許可"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # 団体スタッフかチェック
        if request.user.user_type != 'shelter':
            return False
        
        # この猫の所属団体のスタッフかチェック
        from shelters.models import ShelterUser
        return ShelterUser.objects.filter(
            shelter=obj.shelter,
            user=request.user,
            is_active=True
        ).exists()


class IsApplicationParty(permissions.BasePermission):
    """応募の当事者（応募者または団体スタッフ）のみ許可"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # 応募者本人
        if obj.applicant == request.user:
            return True
        
        # 団体スタッフ
        if request.user.user_type == 'shelter':
            from shelters.models import ShelterUser
            return ShelterUser.objects.filter(
                shelter=obj.shelter,
                user=request.user,
                is_active=True
            ).exists()
        
        return False
