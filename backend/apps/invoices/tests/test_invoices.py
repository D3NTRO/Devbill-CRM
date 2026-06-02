import pytest
from decimal import Decimal
from django.utils import timezone
from apps.clients.models import Client, ActivityLog
from apps.projects.models import Project
from apps.time_entries.models import TimeEntry
from apps.invoices.models import Invoice, InvoiceItem

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    return Client.objects.create(name='Inv Client', email='inv@test.com', freelancer=user)


@pytest.fixture
def billable_project(user, client):
    project = Project.objects.create(
        name='Billable', client=client, freelancer=user,
        billing_type='HOURLY', hourly_rate='50.00',
    )
    TimeEntry.objects.create(
        project=project, freelancer=user, description='Hours worked',
        started_at=timezone.now(), date=timezone.now().date(),
        duration_minutes=120, is_billable=True, invoiced=False,
    )
    TimeEntry.objects.create(
        project=project, freelancer=user, description='More work',
        started_at=timezone.now(), date=timezone.now().date(),
        duration_minutes=60, is_billable=True, invoiced=False,
    )
    return project


# ─── Create ───────────────────────────────────────────────────

class TestInvoiceCreate:
    def test_create_invoice_with_items(self, auth_client, client):
        data = {
            'client': str(client.id),
            'issue_date': '2026-06-01',
            'due_date': '2026-07-01',
            'tax_rate': '21.00',
            'notes': 'Monthly invoice',
            'items': [
                {'description': 'Design work', 'quantity': 40, 'unit_price': '50.00'},
                {'description': 'Dev work', 'quantity': 20, 'unit_price': '75.00'},
            ],
        }
        response = auth_client.post('/api/v1/invoices/', data, format='json')
        assert response.status_code == 201
        assert response.data['number'].startswith('INV-')
        assert Decimal(response.data['subtotal']) == Decimal('3500.00')
        assert Decimal(response.data['tax_amount']) == Decimal('735.00')
        assert Decimal(response.data['total']) == Decimal('4235.00')
        assert len(response.data['items']) == 2
        assert Invoice.objects.count() == 1

    def test_create_invoice_fails_without_client(self, auth_client):
        response = auth_client.post('/api/v1/invoices/', {
            'issue_date': '2026-06-01',
            'due_date': '2026-07-01',
            'items': [],
        }, format='json')
        assert response.status_code == 400

    def test_create_invoice_fails_for_other_users_client(self, auth_client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        response = auth_client.post('/api/v1/invoices/', {
            'client': str(other_client.id),
            'issue_date': '2026-06-01',
            'due_date': '2026-07-01',
            'items': [],
        }, format='json')
        assert response.status_code == 404


# ─── List / Detail ─────────────────────────────────────────────

class TestInvoiceListDetail:
    def test_list_own_invoices(self, auth_client, client):
        data = {
            'client': str(client.id),
            'issue_date': '2026-06-01',
            'due_date': '2026-07-01',
            'items': [{'description': 'Work', 'quantity': 1, 'unit_price': '100'}],
        }
        auth_client.post('/api/v1/invoices/', data, format='json')
        response = auth_client.get('/api/v1/invoices/')
        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_does_not_see_other_users_invoices(self, auth_client, client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        Invoice.objects.create(
            client=other_client, number='INV-002', issue_date=timezone.now().date(),
            due_date=timezone.now().date(), subtotal=100, total=100,
        )
        Invoice.objects.create(
            client=client, number='INV-001', issue_date=timezone.now().date(),
            due_date=timezone.now().date(), subtotal=200, total=200,
        )
        response = auth_client.get('/api/v1/invoices/')
        numbers = [inv['number'] for inv in response.data['results']]
        assert 'INV-002' not in numbers
        assert 'INV-001' in numbers

    def test_get_invoice_detail(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001', issue_date=timezone.now().date(),
            due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.get(f'/api/v1/invoices/{invoice.id}/')
        assert response.status_code == 200
        assert response.data['number'] == 'INV-001'

    def test_cannot_access_other_users_invoice(self, auth_client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        invoice = Invoice.objects.create(
            client=other_client, number='INV-002', issue_date=timezone.now().date(),
            due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.get(f'/api/v1/invoices/{invoice.id}/')
        assert response.status_code == 404


# ─── Filters ───────────────────────────────────────────────────

class TestInvoiceFilters:
    def test_filter_by_status(self, auth_client, client):
        Invoice.objects.create(
            client=client, number='INV-001', status='DRAFT',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        Invoice.objects.create(
            client=client, number='INV-002', status='SENT',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.get('/api/v1/invoices/?status=SENT')
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['number'] == 'INV-002'

    def test_filter_by_client(self, auth_client, user, client):
        other_client = Client.objects.create(name='Other', email='other@test.com', freelancer=user)
        Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        Invoice.objects.create(
            client=other_client, number='INV-002',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.get(f'/api/v1/invoices/?client={client.id}')
        assert len(response.data['results']) == 1


# ─── Update / Delete ───────────────────────────────────────────

class TestInvoiceUpdateDelete:
    def test_update_invoice_metadata(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(),
            subtotal=100, total=100, notes='Original',
        )
        response = auth_client.patch(f'/api/v1/invoices/{invoice.id}/', {
            'notes': 'Updated notes',
            'tax_rate': '10.00',
        }, format='json')
        assert response.status_code == 200
        assert response.data['notes'] == 'Updated notes'

    def test_update_invoice_items(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(),
            subtotal=100, total=121, tax_rate=21,
        )
        InvoiceItem.objects.create(
            invoice=invoice, description='Old item', quantity=1, unit_price=100, order=0,
        )

        response = auth_client.patch(f'/api/v1/invoices/{invoice.id}/', {
            'items': [
                {'description': 'New item', 'quantity': 2, 'unit_price': '50.00'},
            ],
        }, format='json')
        assert response.status_code == 200
        assert len(response.data['items']) == 1
        assert response.data['items'][0]['description'] == 'New item'
        assert Decimal(response.data['subtotal']) == Decimal('100.00')
        assert invoice.items.count() == 1

    def test_delete_invoice(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.delete(f'/api/v1/invoices/{invoice.id}/')
        assert response.status_code == 204
        assert Invoice.objects.count() == 0


# ─── Actions ───────────────────────────────────────────────────

class TestInvoiceActions:
    def test_mark_sent(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.post(f'/api/v1/invoices/{invoice.id}/mark_sent/')
        assert response.status_code == 200
        assert response.data['status'] == 'SENT'
        assert ActivityLog.objects.filter(client=client, event_type='INVOICE_SENT').exists()

    def test_mark_paid(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.post(f'/api/v1/invoices/{invoice.id}/mark_paid/')
        assert response.status_code == 200
        assert response.data['status'] == 'PAID'
        assert response.data['paid_at'] is not None
        assert ActivityLog.objects.filter(client=client, event_type='INVOICE_PAID').exists()

    def test_from_project_creates_invoice(self, auth_client, client, billable_project):
        response = auth_client.post(f'/api/v1/invoices/{billable_project.id}/from_project/')
        assert response.status_code == 201
        assert response.data['subtotal'] is not None
        assert len(response.data['items']) == 2
        assert Invoice.objects.count() == 1

    def test_from_project_fails_without_billable_entries(self, auth_client, client, billable_project):
        billable_project.time_entries.all().update(invoiced=True)
        response = auth_client.post(f'/api/v1/invoices/{billable_project.id}/from_project/')
        assert response.status_code == 400

    def test_pdf_action_returns_info(self, auth_client, client):
        invoice = Invoice.objects.create(
            client=client, number='INV-001',
            issue_date=timezone.now().date(), due_date=timezone.now().date(), subtotal=100, total=100,
        )
        response = auth_client.get(f'/api/v1/invoices/{invoice.id}/pdf/')
        assert response.status_code == 200
        assert 'invoice_id' in response.data
