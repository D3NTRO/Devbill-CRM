from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Client, Tag, ActivityLog
from .serializers import (
    ClientSerializer, ClientSummarySerializer,
    TagSerializer, ActivityLogSerializer
)


class ClientViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ClientSerializer

    def get_queryset(self):
        return Client.objects.filter(freelancer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)

    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        client = self.get_object()
        serializer = ClientSummarySerializer(client)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        client = self.get_object()
        activities = client.activity_logs.all()[:50]
        serializer = ActivityLogSerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def notes(self, request, pk=None):
        client = self.get_object()
        note_text = request.data.get('note', '')
        
        if not note_text:
            return Response(
                {'error': 'El campo note es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        activity = ActivityLog.objects.create(
            client=client,
            event_type='NOTE_ADDED',
            description=note_text,
            metadata={'note': note_text}
        )
        
        return Response(
            ActivityLogSerializer(activity).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'])
    def tags(self, request, pk=None):
        client = self.get_object()
        tag_ids = request.data.get('tag_ids', [])
        
        tags = Tag.objects.filter(
            id__in=tag_ids,
            freelancer=request.user
        )
        client.tags.set(tags)
        
        return Response(TagSerializer(client.tags.all(), many=True).data)


class TagViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.filter(freelancer=self.request.user)

    def perform_create(self, serializer):
        serializer.save(freelancer=self.request.user)