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
from shelters.serializers import ShelterRegistrationSerializer


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


class ShelterRegistrationView(generics.CreateAPIView):
    """保護団体登録API"""
    
    serializer_class = ShelterRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        # 管理者へ通知メール送信
        try:
            from django.core.mail import send_mail
            from shelters.models import ShelterUser
            
            # 作成されたばかりの団体情報を取得
            shelter_user = ShelterUser.objects.filter(user=user).select_related('shelter').first()
            shelter_name = shelter_user.shelter.name if shelter_user and shelter_user.shelter else '（団体名不明）'
            
            subject = '【保護猫マッチング】新規団体登録がありました'
            message = f"""
新規の保護団体登録がありました。
管理画面から内容を確認し、審査を行ってください。

団体名: {shelter_name}
登録ユーザー: {user.username} ({user.email})

審査管理画面: http://localhost:3000/admin/shelters
            """
            from_email = 'system@example.com'
            recipient_list = ['zhanghiromo@gmail.com']
            
            send_mail(subject, message, from_email, recipient_list)
            print(f"Notification email sent to {recipient_list}")
        except Exception as e:
            # メールの失敗で登録自体を失敗させない
            print(f"Failed to send notification email: {e}")
        
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
