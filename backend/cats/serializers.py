from rest_framework import serializers
from .models import Cat, CatImage, CatVideo

class CatImageSerializer(serializers.ModelSerializer):
    """保護猫画像シリアライザー"""
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CatImage
        fields = ['id', 'image', 'image_url', 'is_primary', 'sort_order', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class CatVideoSerializer(serializers.ModelSerializer):
    """保護猫動画シリアライザー"""
    video_url = serializers.SerializerMethodField()

    class Meta:
        model = CatVideo
        fields = ['id', 'video', 'video_url', 'sort_order', 'caption', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_video_url(self, obj):
        if obj.video:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video.url)
            return obj.video.url
        return None

class CatListSerializer(serializers.ModelSerializer):
    """保護猫一覧用シリアライザー"""
    
    primary_image = serializers.SerializerMethodField()
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    
    class Meta:
        model = Cat
        fields = [
            'id', 'name', 'gender', 'age_years', 'age_months',
            'breed', 'size', 'color', 'status', 'primary_image',
            'shelter_name', 'created_at'
        ]
    
    def get_primary_image(self, obj):
        image_url = obj.primary_image_url
        if image_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

class ShelterInfoSerializer(serializers.Serializer):
    """保護団体情報シリアライザー（CatDetail用のネストされたシリアライザー）"""
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True, allow_blank=True)
    email = serializers.EmailField(read_only=True, allow_blank=True)


class CatDetailSerializer(serializers.ModelSerializer):
    """保護猫詳細用シリアライザー"""
    
    images = CatImageSerializer(many=True, read_only=True)
    videos = CatVideoSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    
    # 修正: Shelter情報をネストされたシリアライザーで返す
    shelter = ShelterInfoSerializer(read_only=True)
    shelter_name = serializers.CharField(source='shelter.name', read_only=True)
    
    class Meta:
        model = Cat
        fields = [
            'id', 'name', 'gender', 'age_years', 'age_months',
            'breed', 'size', 'color', 'personality', 'health_status',
            'vaccination', 'neutered', 'description', 'status',
            'images', 'videos', 'primary_image', 'shelter', 'shelter_name', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_primary_image(self, obj):
        image_url = obj.primary_image_url
        if image_url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            return image_url
        return None

class CatCreateUpdateSerializer(serializers.ModelSerializer):
    """保護猫作成・更新用シリアライザー"""
    
    class Meta:
        model = Cat
        fields = [
            'name', 'gender', 'age_years', 'age_months',
            'breed', 'size', 'color', 'personality', 'health_status',
            'vaccination', 'neutered', 'description', 'status'
        ]
