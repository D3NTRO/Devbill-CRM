from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceCreateSerializer


class InvoiceViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        qs = Invoice.objects.filter(
            client__freelancer=self.request.user
        ).select_related('client').prefetch_related('items')

        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status.upper())

        client = self.request.query_params.get('client')
        if client:
            qs = qs.filter(client_id=client)

        date_from = self.request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(issue_date__gte=date_from)

        date_to = self.request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(issue_date__lte=date_to)

        return qs

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
                    project = client.projects.get(id=project, freelancer=request.user)
                except:
                    project = None

            item = InvoiceItem.objects.create(
                invoice=invoice,
                order=idx,
                description=item_data['description'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                project=project,
            )
            subtotal += item.amount

        invoice.subtotal = subtotal
        invoice.calculate_totals()
        invoice.save()

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()

        items_data = request.data.get('items')
        if items_data is not None:
            from decimal import Decimal
            instance.items.all().delete()
            subtotal = Decimal('0')
            for idx, item_data in enumerate(items_data):
                item_data.setdefault('project', None)
                item = InvoiceItem.objects.create(
                    invoice=instance,
                    order=idx,
                    description=item_data['description'],
                    quantity=item_data['quantity'],
                    unit_price=Decimal(str(item_data['unit_price'])),
                )
                subtotal += item.amount
            instance.subtotal = subtotal
            instance.calculate_totals()
            instance.save()
            instance.refresh_from_db()
            return Response(self.get_serializer(instance).data)

        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def pdf(self, request, pk=None):
        invoice = self.get_object()
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
            metadata={'invoice_id': str(invoice.id), 'number': invoice.number},
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
            metadata={'invoice_id': str(invoice.id), 'number': invoice.number},
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
        entries_by_description = {}
        for entry in unbilled_entries:
            desc = entry.description or 'Trabajo realizado'
            if desc not in entries_by_description:
                entries_by_description[desc] = {'quantity': 0, 'unit_price': hourly_rate}
            hours = (entry.duration_minutes or 0) / 60
            entries_by_description[desc]['quantity'] += hours

        for desc, data in entries_by_description.items():
            items.append({
                'description': desc,
                'quantity': round(data['quantity'], 2),
                'unit_price': float(data['unit_price']),
            })

        invoice = Invoice.objects.create(
            client=project.client,
            issue_date=timezone.now().date(),
            due_date=timezone.now().date(),
            subtotal=0,
            tax_rate=0,
            notes=f'Factura automática del proyecto {project.name}',
        )

        subtotal = 0
        for idx, item_data in enumerate(items):
            item = InvoiceItem.objects.create(
                invoice=invoice,
                order=idx,
                description=item_data['description'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                project=project,
            )
            subtotal += item.amount

        invoice.subtotal = subtotal
        invoice.calculate_totals()
        invoice.save()

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
