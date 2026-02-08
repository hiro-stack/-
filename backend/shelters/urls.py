from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShelterViewSet

router = DefaultRouter()
router.register(r'', ShelterViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
