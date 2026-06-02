from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(freelancer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)
