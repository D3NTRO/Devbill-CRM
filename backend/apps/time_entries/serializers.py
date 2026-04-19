from rest_framework import serializers
from .models import TimeEntry


class TimeEntrySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            'id', 'project', 'project_name', 'client_name', 'description',
            'started_at', 'ended_at', 'duration_minutes', 'is_billable',
            'invoiced', 'date'
        ]
        read_only_fields = ['id', 'started_at', 'ended_at', 'duration_minutes', 'date']

    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)