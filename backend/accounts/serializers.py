from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


from shelters.models import ShelterUser

class UserPrivateSerializer(serializers.ModelSerializer):
    """ユーザー詳細シリアライザー（管理者・本人・保護団体用）
    
    【取扱注意】
    個人情報（email, phone_number, address）を含みます。
    公開APIでは絶対に使用せず、権限チェック済みのViewでのみ使用してください。
    
    ユーザーが自分の情報を確認（GET）する際に主に使用します。
    更新には UserMeUpdateSerializer を推奨します。
    """
    
    shelter_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'user_type', 'phone_number',
            'address', 'profile_image', 'bio', 'created_at',
            'shelter_role'
        ]
        # GET用として安全性を確保（万が一更新に使われても重要項目は不可）
        read_only_fields = ['id', 'username', 'email', 'user_type', 'created_at']

    def get_shelter_role(self, obj):
        if obj.user_type != 'shelter':
            return None
            
        shelter_user = ShelterUser.objects.filter(user=obj, is_active=True).first()
        if shelter_user:
            return shelter_user.role
        return None


class UserMeUpdateSerializer(serializers.ModelSerializer):
    """ユーザー本人によるプロフィール更新用シリアライザー
    
    セキュリティ対策:
    - user_type, email, username などの重要フィールドを含めない（またはread_only）。
    - ユーザーが任意に変更して良いフィールドのみを許可する。
    """
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'address', 'profile_image', 'bio', 
            # 以下のフィールドは表示のみ（更新不可）
            'username', 'email', 'user_type'
        ]
        read_only_fields = ['id', 'username', 'email', 'user_type']


class UserPublicSerializer(serializers.ModelSerializer):
    """公開用ユーザーシリアライザー（他人が見る用）
    
    セキュリティ対策: 
    - 個人情報（メール、電話、住所）を完全に除外
    - IDは公開（プロフィールリンク等で使用するため）
    """
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'user_type', 'profile_image', 'bio'
        ]
        read_only_fields = ['id']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """ユーザー登録用シリアライザー
    
    セキュリティ対策: 
    - user_typeを自由入力させない（adopter固定）
    - password_confirm による確認
    - email 必須
    """
    
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    # emailは必須入力とする
    email = serializers.EmailField(required=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'phone_number', 'address'
        ]
    
    def validate_username(self, value):
        """ユーザー名の重複チェック"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("このユーザー名は既に使用されています。")
        return value

    def validate_email(self, value):
        """メールアドレスの重複チェック"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("このメールアドレスは既に登録されています。")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "パスワードが一致しません"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        try:
            # ユーザータイプをadopter（飼い主希望者）に固定
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=password,
                user_type='adopter',
                phone_number=validated_data.get('phone_number', ''),
                address=validated_data.get('address', '')
            )
            return user
        except IntegrityError:
            raise serializers.ValidationError("ユーザー登録中にエラーが発生しました。")
