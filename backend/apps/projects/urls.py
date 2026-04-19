from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, PipelineViewSet

router = DefaultRouter()
router.register('', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
    path('pipeline/', PipelineViewSet.as_view({'get': 'list'}), name='pipeline'),
    path('pipeline/reorder/', PipelineViewSet.as_view({'post': 'reorder'}), name='pipeline-reorder'),
    path('pipeline/<uuid:pk>/move/', PipelineViewSet.as_view({'patch': 'move'}), name='pipeline-move'),
]