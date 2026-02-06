from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ApplicationViewSet, MessageViewSet

# ViewSetを使用しているため、DefaultRouterでURLを自動生成
router = DefaultRouter()
router.register(r'applications', ApplicationViewSet, basename='application')
router.register(r'messages', MessageViewSet, basename='message')

# config.urlsで 'api/applications/' に include されているとパスが重複する可能性があるため確認が必要。
# config.urlsが 'api/' で include していれば router.urls は 'applications/' と 'messages/' になる。
# しかし、config.urls では:
# path('api/applications/', include('applications.urls')) 
# となっているため、ここで router をそのまま使うと:
# /api/applications/applications/
# /api/applications/messages/
# となり、少し冗長かつ直感的でない。
#
# 下記のように調整する。

urlpatterns = [
    path('', include(router.urls)),
]
