from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.utils import timezone
from django.db import models
from django.template.loader import render_to_string
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceCreateSerializer

# WeasyPrint requires GTK libraries - use only with Docker in production
# from weasyprint import HTML


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        return Invoice.objects.filter(client__freelancer=self.request.user).select_related('client')

    def create(self, request, *args, **kwargs):
        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        from apps.clients.models import Client
        try:
            client = Client.objects.get(
                id=serializer.validated_data['client'],
                freelancer=request.user
            )
        except Client.DoesNotExist:
            return Response(
                {'error': 'Cliente no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        invoice = Invoice.objects.create(
            client=client,
            issue_date=serializer.validated_data['issue_date'],
            due_date=serializer.validated_data['due_date'],
            tax_rate=serializer.validated_data.get('tax_rate', 0),
            notes=serializer.validated_data.get('notes', ''),
        )
        
        subtotal = 0
        for idx, item_data in enumerate(serializer.validated_data['items']):
            project = item_data.get('project')
            if project:
                try:
                    project = invoice.client.projects.get(id=project, freelancer=request.user)
                except:
                    project = None
            
            item = InvoiceItem.objects.create(
                invoice=invoice,
                order=idx,
                description=item_data['description'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                project=project
            )
            subtotal += item.amount
        
        invoice.subtotal = subtotal
        invoice.calculate_totals()
        invoice.save()
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
        
        # PDF generation requires WeasyPrint with GTK - use Docker for PDF generation
        return Response({
            'message': 'PDF not available in local development. Use Docker for PDF generation.',
            'invoice_id': str(invoice.id),
            'number': invoice.number,
        })

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'SENT'
        invoice.save()
        
        from apps.clients.models import ActivityLog
        ActivityLog.objects.create(
            client=invoice.client,
            event_type='INVOICE_SENT',
            description=f'Factura {invoice.number} enviada',
            metadata={'invoice_id': str(invoice.id), 'number': invoice.number}
        )
        
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'PAID'
        invoice.paid_at = timezone.now()
        invoice.save()
        
        for item in invoice.items.all():
            if item.project:
                from apps.time_entries.models import TimeEntry
                TimeEntry.objects.filter(
                    project=item.project,
                    invoiced=False
                ).update(invoiced=True)
        
        from apps.clients.models import ActivityLog
        ActivityLog.objects.create(
            client=invoice.client,
            event_type='INVOICE_PAID',
            description=f'Factura {invoice.number} pagada',
            metadata={'invoice_id': str(invoice.id), 'number': invoice.number}
        )
        
        return Response(InvoiceSerializer(invoice).data)

    @action(detail=True, methods=['post'])
    def from_project(self, request, pk=None):
        from apps.projects.models import Project
        try:
            project = Project.objects.get(id=pk, freelancer=request.user)
        except Project.DoesNotExist:
            return Response(
                {'error': 'Proyecto no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        unbilled_entries = project.time_entries.filter(
            is_billable=True,
            invoiced=False
        )
        
        if not unbilled_entries.exists():
            return Response(
                {'error': 'No hay entradas de tiempo facturables'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.users.models import FreelancerProfile
        profile = FreelancerProfile.objects.filter(user=request.user).first()
        hourly_rate = profile.default_hourly_rate if profile else 0
        
        items = []
        total = 0
        
        entries_by_description = {}
        for entry in unbilled_entries:
            desc = entry.description or 'Trabajo realizado'
            if desc not in entries_by_description:
                entries_by_description[desc] = {'quantity': 0, 'unit_price': hourly_rate}
            hours = (entry.duration_minutes or 0) / 60
            entries_by_description[desc]['quantity'] += hours
        
        for desc, data in entries_by_description.items():
            amount = data['quantity'] * data['unit_price']
            items.append({
                'description': desc,
                'quantity': round(data['quantity'], 2),
                'unit_price': float(data['unit_price']),
            })
            total += amount
        
        invoice = Invoice.objects.create(
            client=project.client,
            issue_date=timezone.now().date(),
            due_date=timezone.now().date(),
            subtotal=total,
            tax_rate=0,
            notes=f'Factura automática del proyecto {project.name}'
        )
        
        for idx, item_data in enumerate(items):
            InvoiceItem.objects.create(
                invoice=invoice,
                order=idx,
                description=item_data['description'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                project=project
            )
        
        invoice.calculate_totals()
        invoice.save()
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)