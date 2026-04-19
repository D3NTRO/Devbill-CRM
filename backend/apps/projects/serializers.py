from rest_framework import serializers
from .models import Project, PipelineStage


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    total_hours = serializers.FloatField(read_only=True)
    total_invoiced = serializers.FloatField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'client', 'client_name', 'name', 'description',
            'billing_type', 'hourly_rate', 'fixed_price', 'estimated_hours',
            'status', 'pipeline_stage', 'column_order', 'estimated_value',
            'lead_source', 'color', 'start_date', 'deadline',
            'total_hours', 'total_invoiced', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['freelancer'] = self.context['request'].user
        return super().create(validated_data)

    def validate(self, data):
        if data.get('billing_type') == 'HOURLY' and not data.get('hourly_rate'):
            raise serializers.ValidationError({
                'hourly_rate': 'Required for hourly billing'
            })
        if data.get('billing_type') == 'FIXED' and not data.get('fixed_price'):
            raise serializers.ValidationError({
                'fixed_price': 'Required for fixed billing'
            })
        return data


class PipelineMoveSerializer(serializers.Serializer):
    pipeline_stage = serializers.ChoiceField(choices=PipelineStage.choices)


class PipelineReorderSerializer(serializers.Serializer):
    projects = serializers.ListField(
        child=serializers.UUIDField()
    )