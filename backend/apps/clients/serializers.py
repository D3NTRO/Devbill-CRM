from rest_framework import serializers
from django.db import models
from .models import Client, Tag, ActivityLog


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = ['id', 'event_type', 'description', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']


class ClientSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'phone', 'company', 'address',
            'currency', 'tax_id', 'notes', 'is_active', 'tags', 'tag_ids',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        validated_data['freelancer'] = self.context['request'].user
        client = super().create(validated_data)
        
        if tag_ids:
            tags = Tag.objects.filter(
                id__in=tag_ids,
                freelancer=self.context['request'].user
            )
            client.tags.set(tags)
        
        return client

    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        client = super().update(instance, validated_data)
        
        if tag_ids is not None:
            tags = Tag.objects.filter(
                id__in=tag_ids,
                freelancer=self.context['request'].user
            )
            client.tags.set(tags)
        
        return client


class ClientSummarySerializer(serializers.ModelSerializer):
    total_projects = serializers.SerializerMethodField()
    total_invoiced = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    total_hours = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'email', 'company', 'currency',
            'total_projects', 'total_invoiced', 'total_paid', 'total_hours',
            'created_at'
        ]

    def get_total_projects(self, obj):
        return obj.projects.count()

    def get_total_invoiced(self, obj):
        from apps.invoices.models import Invoice
        return float(
            Invoice.objects.filter(client=obj).aggregate(
                total=models.Sum('total')
            )['total'] or 0
        )

    def get_total_paid(self, obj):
        from apps.invoices.models import Invoice
        return float(
            Invoice.objects.filter(client=obj, status='PAID').aggregate(
                total=models.Sum('total')
            )['total'] or 0
        )

    def get_total_hours(self, obj):
        from apps.time_entries.models import TimeEntry
        result = TimeEntry.objects.filter(
            project__client=obj
        ).aggregate(total=models.Sum('duration_minutes'))
        return round((result['total'] or 0) / 60, 2)