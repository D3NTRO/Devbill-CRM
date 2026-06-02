from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'client', 'project', 'due_date',
            'status', 'priority', 'reminder_sent',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reminder_sent', 'created_at', 'updated_at']

    def validate(self, attrs):
        if 'title' in attrs and not attrs['title'].strip():
            raise serializers.ValidationError({'title': 'El título no puede estar vacío'})
        return attrs
