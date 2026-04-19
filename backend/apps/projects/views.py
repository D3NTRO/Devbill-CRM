from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, models
from .models import Project, PipelineStage
from .serializers import ProjectSerializer, PipelineMoveSerializer, PipelineReorderSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProjectSerializer

    def get_queryset(self):
        return Project.objects.filter(freelancer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    @action(detail=True, methods=['get'])
    def time_entries(self, request, pk=None):
        project = self.get_object()
        from apps.time_entries.models import TimeEntry
        from apps.time_entries.serializers import TimeEntrySerializer
        
        entries = TimeEntry.objects.filter(project=project)
        serializer = TimeEntrySerializer(entries, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def unbilled_hours(self, request, pk=None):
        project = self.get_object()
        from apps.time_entries.models import TimeEntry
        
        result = TimeEntry.objects.filter(
            project=project,
            is_billable=True,
            invoiced=False
        ).aggregate(total=models.Sum('duration_minutes'))
        
        hours = round((result['total'] or 0) / 60, 2)
        return Response({'unbilled_hours': hours})


class PipelineViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        projects = Project.objects.filter(
            freelancer=request.user
        ).select_related('client')
        
        pipeline = {}
        for stage in PipelineStage.choices:
            stage_projects = projects.filter(pipeline_stage=stage[0]).order_by('column_order')
            pipeline[stage[0]] = ProjectSerializer(stage_projects, many=True).data
        
        return Response(pipeline)

    @action(detail=True, methods=['patch'])
    def move(self, request, pk=None):
        project = Project.objects.get(
            id=pk,
            freelancer=request.user
        )
        serializer = PipelineMoveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        project.pipeline_stage = serializer.validated_data['pipeline_stage']
        project.save()
        
        return Response(ProjectSerializer(project).data)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        serializer = PipelineReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        project_ids = serializer.validated_data['projects']
        
        with transaction.atomic():
            for idx, project_id in enumerate(project_ids):
                Project.objects.filter(
                    id=project_id,
                    freelancer=request.user
                ).update(column_order=idx)
        
        return Response({'success': True})