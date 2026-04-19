from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet, TagViewSet

router = DefaultRouter()
router.register('', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
    path('tags/', TagViewSet.as_view({'get': 'list', 'post': 'create'}), name='tags'),
    path('tags/<uuid:pk>/', TagViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='tag-detail'),
]