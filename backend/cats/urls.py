from django.urls import path
from .views import (
    CatListCreateView,
    CatDetailView,
    CatImageUploadView,
    MyCatsView
)

urlpatterns = [
    # 公開・検索・登録用
    path('', CatListCreateView.as_view(), name='cat-list-create'),
    
    # 詳細・更新・削除用
    path('<int:pk>/', CatDetailView.as_view(), name='cat-detail'),
    
    # 画像アップロード（詳細の下位リソースとして定義）
    path('<int:cat_id>/images/', CatImageUploadView.as_view(), name='cat-image-upload'),
    
    # 自団体の猫一覧（管理用ショートカット）
    path('my_cats/', MyCatsView.as_view(), name='my-cats'),
]
