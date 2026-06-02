import pytest

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(user):
    from apps.clients.models import Client
    return Client.objects.create(
        name='SearchCo', email='search@test.com',
        company='Search Inc', freelancer=user,
    )


@pytest.fixture
def project(user, client):
    from apps.projects.models import Project
    return Project.objects.create(
        name='Search Project', description='A searchable project',
        client=client, freelancer=user,
    )


@pytest.fixture
def task(user, client, project):
    from apps.tasks.models import Task
    return Task.objects.create(
        title='Searchable task', freelancer=user,
        status='PENDING', priority='HIGH',
        client=client, project=project,
    )


@pytest.fixture
def proposal(user, project):
    from apps.proposals.models import Proposal
    from django.utils import timezone
    return Proposal.objects.create(
        project=project, title='Search Proposal',
        description='A searchable proposal',
        total=0, status='DRAFT',
        valid_until=timezone.now().date(),
    )


@pytest.fixture
def invoice(user, client):
    from apps.invoices.models import Invoice
    return Invoice.objects.create(
        client=client, number='INV-SEARCH-001',
        issue_date='2026-06-01', due_date='2026-07-01',
        subtotal=100, total=100,
    )


# ─── Search ─────────────────────────────────────────────────


class TestSearch:
    url = '/api/v1/search/'

    def test_search_finds_all_entity_types(self, auth_client, client, project, task, proposal, invoice):
        response = auth_client.get(self.url, {'q': 'Search'})
        assert response.status_code == 200
        results = response.data['results']
        types = {r['type'] for r in results}
        assert 'client' in types
        assert 'project' in types
        assert 'task' in types
        assert 'proposal' in types
        assert 'invoice' in types

    def test_search_by_number(self, auth_client, invoice):
        response = auth_client.get(self.url, {'q': 'SEARCH-001'})
        assert response.status_code == 200
        results = response.data['results']
        assert len(results) >= 1
        assert results[0]['type'] == 'invoice'

    def test_empty_query_returns_empty(self, auth_client):
        response = auth_client.get(self.url, {'q': ''})
        assert response.status_code == 200
        assert response.data['results'] == []

    def test_no_match_returns_empty(self, auth_client):
        response = auth_client.get(self.url, {'q': 'zzzznonexistent'})
        assert response.status_code == 200
        assert response.data['results'] == []

    def test_search_scoped_by_user(self, api_client, other_user, client):
        from rest_framework.test import APIClient
        c = APIClient()
        response = c.post('/api/v1/auth/login/', {
            'email': 'other@example.com',
            'password': 'otherpass123',
        })
        token = response.data['access']
        c.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        resp = c.get(self.url, {'q': 'SearchCo'})
        assert resp.status_code == 200
        assert resp.data['results'] == []

    def test_search_requires_auth(self, api_client):
        response = api_client.get(self.url, {'q': 'test'})
        assert response.status_code == 401
