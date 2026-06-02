from django.urls import path
from .views import TimeEntryViewSet, TimeEntryRunningView

urlpatterns = [
    path('', TimeEntryViewSet.as_view({'get': 'list', 'post': 'create'})),
    path('<uuid:pk>/', TimeEntryViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'})),
    path('running/', TimeEntryRunningView.as_view()),
    path('start/', TimeEntryViewSet.as_view({'post': 'start'})),
    path('stop/', TimeEntryViewSet.as_view({'post': 'stop'})),
]