from rest_framework import serializers
from .models import Proposal


class ProposalSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)

    class Meta:
        model = Proposal
        fields = [
            'id', 'project', 'project_name', 'client_name', 'title',
            'description', 'items', 'total', 'valid_until', 'status',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        items = validated_data.get('items', [])
        total = sum(item.get('quantity', 0) * item.get('unit_price', 0) for item in items)
        validated_data['total'] = total
        return super().create(validated_data)

    def update(self, instance, validated_data):
        items = validated_data.get('items', None)
        if items is not None:
            total = sum(item.get('quantity', 0) * item.get('unit_price', 0) for item in items)
            validated_data['total'] = total
        return super().update(instance, validated_data)