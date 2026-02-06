from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserPrivateSerializer, 
    UserRegistrationSerializer, 
    UserMeUpdateSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """ユーザー登録API"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # JWTトークンの生成
        refresh = RefreshToken.for_user(user)
        
        # 登録成功時は、本人に返すので PrivateSerializer を使用
        return Response({
            'user': UserPrivateSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """ユーザープロフィール取得・更新API"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        # 更新時(PUT/PATCH)は、更新可能なフィールドのみを定義した専用シリアライザーを使用
        if self.request.method in ['PUT', 'PATCH']:
            return UserMeUpdateSerializer
        # 取得時(GET)は、すべての個人情報を含むシリアライザーを使用
        return UserPrivateSerializer
    
    def get_object(self):
        return self.request.user
