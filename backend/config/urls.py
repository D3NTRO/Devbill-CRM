from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

def api_root(request):
    return JsonResponse({
        'status': 'ok',
        'message': 'DevBill API is running',
        'docs': '/api/docs/'
    })

urlpatterns = [
    path('', api_root),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.users.urls')),
    path('api/v1/clients/', include('apps.clients.urls')),
    path('api/v1/projects/', include('apps.projects.urls')),
    path('api/v1/time-entries/', include('apps.time_entries.urls')),
    path('api/v1/proposals/', include('apps.proposals.urls')),
    path('api/v1/invoices/', include('apps.invoices.urls')),
    path('api/v1/search/', include('apps.search.urls')),
    path('api/v1/dashboard/', include('apps.dashboard.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(), name='swagger-ui'),
]