import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    from apps.clients.models import Client
    return Client.objects.create(name='Dash Client', email='dash@test.com', freelancer=user)


@pytest.fixture
def paid_invoice(user, client):
    from apps.invoices.models import Invoice
    return Invoice.objects.create(
        client=client, number='INV-PAID',
        issue_date=timezone.now().date() - timedelta(days=60),
        due_date=timezone.now().date() - timedelta(days=30),
        paid_at=timezone.now(),
        subtotal=Decimal('1000'), total=Decimal('1210'),
        tax_rate=Decimal('21'), status='PAID',
    )


@pytest.fixture
def unpaid_invoice(user, client):
    from apps.invoices.models import Invoice
    return Invoice.objects.create(
        client=client, number='INV-UNPAID',
        issue_date=timezone.now().date() - timedelta(days=45),
        due_date=timezone.now().date() - timedelta(days=10),
        subtotal=Decimal('500'), total=Decimal('500'),
        status='SENT',
    )


@pytest.fixture
def task(user, client):
    from apps.tasks.models import Task
    return Task.objects.create(
        title='Pending task', freelancer=user,
        status='PENDING', priority='MEDIUM',
        client=client,
    )


@pytest.fixture
def time_entry(user, client):
    from apps.time_entries.models import TimeEntry
    from apps.projects.models import Project
    project = Project.objects.create(
        name='Dash Project', client=client, freelancer=user,
    )
    return TimeEntry.objects.create(
        project=project, freelancer=user,
        description='Some work',
        started_at=timezone.now(), date=timezone.now().date(),
        duration_minutes=300, is_billable=True,
    )


@pytest.fixture
def proposal(user, client):
    from apps.proposals.models import Proposal
    from apps.projects.models import Project
    from django.utils import timezone
    project = Project.objects.create(
        name='Proj for proposal', client=client, freelancer=user,
    )
    return Proposal.objects.create(
        project=project, title='Test Proposal',
        total=Decimal('1000'), status='ACCEPTED',
        valid_until=timezone.now().date() + timedelta(days=30),
    )


# ─── Stats ──────────────────────────────────────────────────


class TestDashboardStats:
    url = '/api/v1/dashboard/stats/'

    def test_stats_returns_all_metrics(self, auth_client, client, paid_invoice, unpaid_invoice, task, time_entry):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert data['clients'] == 1
        assert isinstance(data['projects'], int)
        assert data['hours'] > 0
        assert data['revenue'] > 0
        assert data['pending_invoices'] >= 1
        assert data['tasks_pending'] >= 1

    def test_stats_scoped_by_user(self, api_client, other_user, client, paid_invoice):
        """Other user should see zero metrics."""
        from rest_framework.test import APIClient
        from django.contrib.auth import get_user_model
        User = get_user_model()
        c = APIClient()
        response = c.post('/api/v1/auth/login/', {
            'email': 'other@example.com',
            'password': 'otherpass123',
        })
        token = response.data['access']
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        resp = c.get(self.url)
        assert resp.status_code == 200
        assert resp.data['clients'] == 0
        assert resp.data['projects'] == 0
        assert resp.data['revenue'] == 0

    def test_stats_requires_auth(self, api_client):
        response = api_client.get(self.url)
        assert response.status_code == 401


# ─── Revenue Chart ──────────────────────────────────────────


class TestRevenueChart:
    url = '/api/v1/dashboard/revenue-chart/'

    def test_revenue_chart_returns_monthly_data(self, auth_client, paid_invoice):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert isinstance(response.data, list)
        if len(response.data) > 0:
            entry = response.data[0]
            assert 'month' in entry
            assert 'total' in entry
            assert entry['total'] > 0


# ─── Overdue Invoices ───────────────────────────────────────


class TestOverdueInvoices:
    url = '/api/v1/dashboard/overdue-invoices/'

    def test_overdue_invoices_returns_overdue_list(self, auth_client, unpaid_invoice):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        inv = response.data[0]
        assert inv['number'] == 'INV-UNPAID'
        assert inv['days_overdue'] > 0

    def test_no_overdue_when_none(self, auth_client, client):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert response.data == []


# ─── Top Clients ────────────────────────────────────────────


class TestTopClients:
    url = '/api/v1/dashboard/top-clients/'

    def test_top_clients_by_revenue(self, auth_client, paid_invoice, client):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert isinstance(response.data, list)
        if len(response.data) > 0:
            entry = response.data[0]
            assert entry['name'] == client.name
            assert entry['total'] > 0


# ─── Pipeline Value ─────────────────────────────────────────


class TestPipelineValue:
    url = '/api/v1/dashboard/pipeline-value/'

    def test_pipeline_returns_stages(self, auth_client, user, client):
        from apps.projects.models import Project
        Project.objects.create(
            name='Pipeline project', client=client, freelancer=user,
        )
        Project.objects.create(
            name='Won project', client=client, freelancer=user,
            pipeline_stage='ACTIVE', estimated_value=5000,
        )
        response = auth_client.get(self.url)
        assert response.status_code == 200
        assert isinstance(response.data, dict)
        for stage in ['LEAD', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'COMPLETED', 'BILLED']:
            assert stage in response.data


# ─── Win Rate ───────────────────────────────────────────────


class TestWinRate:
    url = '/api/v1/dashboard/win-rate/'

    def test_win_rate_calculation(self, auth_client, proposal):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert 'rate' in data
        assert 'total' in data
        assert 'accepted' in data
        assert data['accepted'] >= 1


# ─── Avg Payment Days ───────────────────────────────────────


class TestAvgPaymentDays:
    url = '/api/v1/dashboard/avg-payment-days/'

    def test_avg_payment_days(self, auth_client, paid_invoice):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert 'average_days' in data
        assert data['average_days'] > 0


# ─── Billable Ratio ─────────────────────────────────────────


class TestBillableRatio:
    url = '/api/v1/dashboard/billable-ratio/'

    def test_billable_ratio(self, auth_client, time_entry):
        response = auth_client.get(self.url)
        assert response.status_code == 200
        data = response.data
        assert 'ratio' in data
        assert 'total_hours' in data
        assert 'billable_hours' in data
        assert data['ratio'] > 0
