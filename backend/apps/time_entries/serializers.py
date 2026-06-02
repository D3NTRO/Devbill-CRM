from rest_framework import serializers
from django.utils import timezone
from .models import TimeEntry


class TimeEntrySerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)

    class Meta:
        model = TimeEntry
        fields = [
            'id', 'project', 'project_name', 'client_name', 'description',
            'started_at', 'ended_at', 'duration_minutes', 'is_billable',
            'invoiced', 'date',
        ]
        read_only_fields = ['id', 'duration_minutes', 'invoiced']
        extra_kwargs = {
            'started_at': {'required': False},
            'date': {'required': False},
            'ended_at': {'required': False},
        }

    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        if 'started_at' not in validated_data:
            validated_data['started_at'] = timezone.now()
        if 'date' not in validated_data:
            validated_data['date'] = validated_data['started_at'].date()
        if validated_data.get('ended_at') and not validated_data.get('duration_minutes'):
            duration = validated_data['ended_at'] - validated_data['started_at']
            validated_data['duration_minutes'] = int(duration.total_seconds() / 60)
        return super().create(validated_data)

    def validate(self, attrs):
        if attrs.get('ended_at') and attrs.get('started_at'):
            if attrs['ended_at'] < attrs['started_at']:
                raise serializers.ValidationError(
                    'ended_at no puede ser anterior a started_at'
                )
        return attrs
