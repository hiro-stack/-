from django.urls import path
from .views import MessageViewSet

urlpatterns = [
    path('', MessageViewSet.as_view({'get': 'list', 'post': 'create'}), name='message-list'),
    path('<int:pk>/', MessageViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='message-detail'),
]
