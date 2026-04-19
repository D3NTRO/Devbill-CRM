from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import TimeEntry
from .serializers import TimeEntrySerializer


class TimeEntryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TimeEntrySerializer

    def get_queryset(self):
        return TimeEntry.objects.filter(freelancer=self.request.user).select_related('project', 'project__client')

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    @action(detail=False, methods=['post'])
    def start(self, request):
        project_id = request.data.get('project_id')
        description = request.data.get('description', '')

        if not project_id:
            return Response(
                {'error': 'project_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        running = TimeEntry.objects.filter(
            freelancer=request.user,
            ended_at__isnull=True
        ).first()

        if running:
            return Response(
                {'error': 'Ya hay un timer activo', 'running_entry': TimeEntrySerializer(running).data},
                status=status.HTTP_400_BAD_REQUEST
            )

        from apps.projects.models import Project
        try:
            project = Project.objects.get(id=project_id, freelancer=request.user)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )

        entry = TimeEntry.objects.create(
            project=project,
            freelancer=request.user,
            description=description,
            started_at=timezone.now(),
            date=timezone.now().date()
        )

        return Response(TimeEntrySerializer(entry).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def stop(self, request):
        entry_id = request.data.get('entry_id')

        if entry_id:
            try:
                entry = TimeEntry.objects.get(id=entry_id, freelancer=request.user)
            except TimeEntry.DoesNotExist:
                return Response(
                    {'error': 'Entrada no encontrada'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            entry = TimeEntry.objects.filter(
                freelancer=request.user,
                ended_at__isnull=True
            ).first()

            if not entry:
                return Response(
                    {'error': 'No hay timer activo'},
                    status=status.HTTP_404_NOT_FOUND
                )

        entry.stop()
        return Response(TimeEntrySerializer(entry).data)

    @action(detail=False, methods=['get'])
    def running(self, request):
        entry = TimeEntry.objects.filter(
            freelancer=request.user,
            ended_at__isnull=True
        ).select_related('project', 'project__client').first()

        if not entry:
            return Response({'detail': 'No hay timer activo'}, status=status.HTTP_404_NOT_FOUND)

        return Response(TimeEntrySerializer(entry).data)