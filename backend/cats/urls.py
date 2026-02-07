from django.urls import path
from .views import (
    CatListCreateView,
    CatDetailView,
    CatImageUploadView,
    CatVideoUploadView,
    MyCatsView
)

urlpatterns = [
    # 公開・検索・登録用
    path('', CatListCreateView.as_view(), name='cat-list-create'),
    
    # 詳細・更新・削除用
    path('<int:pk>/', CatDetailView.as_view(), name='cat-detail'),
    
    # 画像アップロード
    path('<int:cat_id>/images/', CatImageUploadView.as_view(), name='cat-image-upload'),
    
    # 動画アップロード
    path('<int:cat_id>/videos/', CatVideoUploadView.as_view(), name='cat-video-upload'),
    
    # 自団体の猫一覧
    path('my_cats/', MyCatsView.as_view(), name='my-cats'),
]
