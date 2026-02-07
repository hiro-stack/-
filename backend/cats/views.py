from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Q
from .models import Cat, CatImage, CatVideo
from shelters.models import ShelterUser
from .serializers import (
    CatListSerializer,
    CatDetailSerializer,
    CatCreateUpdateSerializer,
    CatImageSerializer,
    CatVideoSerializer
)


class IsShelterMemberOrReadOnly(permissions.BasePermission):
    """保護団体メンバーのみ編集可能（所属チェック付き）"""
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.user_type == 'shelter'
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # オブジェクトのShelterに所属しているかチェック
        return ShelterUser.objects.filter(
            user=request.user,
            shelter=obj.shelter,
            is_active=True
        ).exists()


class CatListCreateView(generics.ListCreateAPIView):
    """保護猫一覧・作成API"""
    
    # create(POST) は IsAuthenticated が必要だが、List(GET) は AllowAny でも良い場合がある
    # ここでは厳密に制御せず、セッション認証前提なら IsAuthenticatedOrReadOnly 的な動きになるよう調整
    # ただし今回は IsShelterMemberOrReadOnly を使っているので、GETは誰でもOK、POSTはShelterのみとなる
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CatCreateUpdateSerializer
        return CatListSerializer
    
    def get_queryset(self):
        queryset = Cat.objects.all()
        
        # 検索フィルター
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(breed__icontains=search) |
                Q(color__icontains=search) |
                Q(personality__icontains=search)
            )

        # フィルター: 性別
        gender = self.request.query_params.get('gender', None)
        if gender:
             queryset = queryset.filter(gender=gender)

        # フィルター: 年齢 (範囲指定)
        min_age = self.request.query_params.get('min_age', None)
        max_age = self.request.query_params.get('max_age', None)
        
        if min_age is not None:
             try:
                 queryset = queryset.filter(age_years__gte=int(min_age))
             except ValueError:
                 pass
        if max_age is not None:
             try:
                 queryset = queryset.filter(age_years__lte=int(max_age))
             except ValueError:
                 pass

        # ステータスフィルター
        cat_status = self.request.query_params.get('status', None)
        
        if cat_status:
            queryset = queryset.filter(status=cat_status)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        
        if not user.is_authenticated or user.user_type != 'shelter':
            raise PermissionDenied("保護団体アカウントでログインしてください。")
        
        # 所属する有効な保護団体を取得
        shelter_user = ShelterUser.objects.filter(
            user=user, 
            is_active=True
        ).first()

        if not shelter_user:
            raise ValidationError("有効な保護団体に所属していないため、猫を登録できません。")
            
        serializer.save(shelter=shelter_user.shelter)


class CatDetailView(generics.RetrieveUpdateDestroyAPIView):
    """保護猫詳細・更新・削除API"""
    
    queryset = Cat.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return CatCreateUpdateSerializer
        return CatDetailSerializer

    def perform_update(self, serializer):
        # 更新権限チェック
        cat = self.get_object()
        user = self.request.user
        
        if not user.is_authenticated or user.user_type != 'shelter':
             raise PermissionDenied("編集権限がありません。")

        is_member = ShelterUser.objects.filter(
            user=user,
            shelter=cat.shelter,
            is_active=True
        ).exists()
        
        if not is_member:
            raise PermissionDenied("この猫を編集する権限がありません（所属団体が異なります）。")
            
        serializer.save()

    def perform_destroy(self, instance):
        # 削除権限チェック
        user = self.request.user
        if not user.is_authenticated or user.user_type != 'shelter':
             raise PermissionDenied("削除権限がありません。")

        is_member = ShelterUser.objects.filter(
            user=user,
            shelter=instance.shelter,
            is_active=True
        ).exists()
        
        if not is_member:
            raise PermissionDenied("この猫を削除する権限がありません。")
            
        instance.delete()


class CatImageUploadView(generics.CreateAPIView):
    """保護猫画像アップロードAPI"""
    
    queryset = CatImage.objects.all()
    serializer_class = CatImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        cat_id = self.kwargs.get('cat_id')  # kwargsから取得するように修正
        user = request.user
        
        try:
            cat = Cat.objects.get(id=cat_id)
        except Cat.DoesNotExist:
            return Response(
                {'error': '保護猫が見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 権限チェック
        is_member = False
        if user.user_type == 'shelter':
            is_member = ShelterUser.objects.filter(
                user=user,
                shelter=cat.shelter,
                is_active=True
            ).exists()
        
        if not is_member:
            raise PermissionDenied('この猫の画像をアップロードする権限がありません')
        
        # serializerにデータを渡す際、catはsave時に渡すのでここではrequest.dataのみ
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cat=cat)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CatVideoUploadView(generics.CreateAPIView):
    """保護猫動画アップロードAPI"""
    
    queryset = CatVideo.objects.all()
    serializer_class = CatVideoSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def create(self, request, *args, **kwargs):
        cat_id = self.kwargs.get('cat_id')
        user = request.user
        
        try:
            cat = Cat.objects.get(id=cat_id)
        except Cat.DoesNotExist:
            return Response(
                {'error': '保護猫が見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 権限チェック
        is_member = False
        if user.user_type == 'shelter':
            is_member = ShelterUser.objects.filter(
                user=user,
                shelter=cat.shelter,
                is_active=True
            ).exists()
        
        if not is_member:
            raise PermissionDenied('この猫の動画をアップロードする権限がありません')
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cat=cat)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyCatsView(generics.ListAPIView):
    """自分の所属する保護団体の猫一覧API"""
    
    serializer_class = CatListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # スーパーユーザーは全件表示（デバッグ・管理者用）
        if user.is_superuser:
            return Cat.objects.all().order_by('-created_at')

        if user.user_type != 'shelter':
             return Cat.objects.none()
             
        # ユーザーが所属する有効な団体IDリスト
        shelter_ids = ShelterUser.objects.filter(
            user=user,
            is_active=True
        ).values_list('shelter', flat=True)
        
        return Cat.objects.filter(shelter__in=shelter_ids).order_by('-created_at')
