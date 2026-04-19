from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimeEntryViewSet

router = DefaultRouter()
router.register('', TimeEntryViewSet, basename='time-entry')

urlpatterns = [
    path('', include(router.urls)),
    path('start/', TimeEntryViewSet.as_view({'post': 'start'}), name='time-entry-start'),
    path('stop/', TimeEntryViewSet.as_view({'post': 'stop'}), name='time-entry-stop'),
    path('running/', TimeEntryViewSet.as_view({'get': 'running'}), name='time-entry-running'),
]