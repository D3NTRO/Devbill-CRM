from rest_framework import serializers
from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'unit_price', 'amount', 'project', 'order']
        read_only_fields = ['id', 'amount']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'client', 'client_name', 'number', 'status',
            'issue_date', 'due_date', 'subtotal', 'tax_rate', 'tax_amount',
            'total', 'notes', 'paid_at', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'number', 'tax_amount', 'total', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = self.context.get('items', [])
        invoice = Invoice.objects.create(**validated_data)
        
        for idx, item_data in enumerate(items_data):
            InvoiceItem.objects.create(
                invoice=invoice,
                order=idx,
                **item_data
            )
        
        invoice.calculate_totals()
        invoice.save()
        return invoice


class InvoiceCreateSerializer(serializers.Serializer):
    client = serializers.UUIDField()
    items = InvoiceItemSerializer(many=True)
    issue_date = serializers.DateField()
    due_date = serializers.DateField()
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=0)
    notes = serializers.CharField(required=False, default='')