from django.urls import path
from .views import ApplicationViewSet

urlpatterns = [
    path('', ApplicationViewSet.as_view({'get': 'list', 'post': 'create'}), name='application-list'),
    path('<int:pk>/', ApplicationViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='application-detail'),
    path('<int:pk>/status/', ApplicationViewSet.as_view({'patch': 'update_status'}), name='application-status'),
    path('<int:pk>/archive/', ApplicationViewSet.as_view({'post': 'archive'}), name='application-archive'),
]
