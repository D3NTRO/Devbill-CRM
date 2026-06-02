import pytest
from django.utils import timezone
from apps.clients.models import Client, Tag, ActivityLog
from apps.projects.models import Project
from apps.time_entries.models import TimeEntry
from apps.invoices.models import Invoice

pytestmark = pytest.mark.django_db


class TestClientCreate:
    def test_create_client_success(self, auth_client):
        data = {'name': 'Acme Corp', 'email': 'contact@acme.com'}
        response = auth_client.post('/api/v1/clients/', data, format='json')

        assert response.status_code == 201
        assert response.data['name'] == 'Acme Corp'
        assert Client.objects.count() == 1

    def test_create_client_generates_activity_log(self, auth_client):
        response = auth_client.post('/api/v1/clients/', {
            'name': 'Activity Test',
            'email': 'test@test.com',
        }, format='json')

        client = Client.objects.get(id=response.data['id'])
        assert ActivityLog.objects.filter(client=client).count() == 1
        assert ActivityLog.objects.filter(client=client, event_type='CLIENT_CREATED').exists()

    def test_create_client_with_tags(self, auth_client, user):
        tag = Tag.objects.create(name='VIP', color='#FF0000', freelancer=user)
        response = auth_client.post('/api/v1/clients/', {
            'name': 'Tagged Client',
            'email': 'tagged@test.com',
            'tag_ids': [str(tag.id)],
        }, format='json')

        assert response.status_code == 201
        client = Client.objects.get(id=response.data['id'])
        assert list(client.tags.all()) == [tag]

    def test_create_client_fails_without_name(self, auth_client):
        response = auth_client.post('/api/v1/clients/', {
            'email': 'noname@test.com',
        }, format='json')

        assert response.status_code == 400


class TestClientList:
    def test_list_own_clients(self, auth_client, user):
        Client.objects.create(name='My Client', email='a@b.com', freelancer=user)
        response = auth_client.get('/api/v1/clients/')

        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_does_not_see_other_users_clients(self, auth_client, user, other_user):
        Client.objects.create(name='Other Client', email='other@b.com', freelancer=other_user)
        Client.objects.create(name='My Client', email='my@b.com', freelancer=user)
        response = auth_client.get('/api/v1/clients/')

        assert response.status_code == 200
        assert len(response.data['results']) == 1


class TestClientDetail:
    def test_get_client_detail(self, auth_client, user):
        client = Client.objects.create(name='Detail Test', email='detail@test.com', freelancer=user)
        response = auth_client.get(f'/api/v1/clients/{client.id}/')

        assert response.status_code == 200
        assert response.data['name'] == 'Detail Test'

    def test_cannot_access_other_users_client(self, auth_client, other_user):
        client = Client.objects.create(name='Secret Client', email='secret@b.com', freelancer=other_user)
        response = auth_client.get(f'/api/v1/clients/{client.id}/')

        assert response.status_code == 404

    def test_update_client(self, auth_client, user):
        client = Client.objects.create(name='Old Name', email='old@test.com', freelancer=user)
        response = auth_client.patch(f'/api/v1/clients/{client.id}/', {
            'name': 'New Name',
        }, format='json')

        assert response.status_code == 200
        assert response.data['name'] == 'New Name'

    def test_delete_client(self, auth_client, user):
        client = Client.objects.create(name='Delete Me', email='delete@test.com', freelancer=user)
        response = auth_client.delete(f'/api/v1/clients/{client.id}/')

        assert response.status_code == 204
        assert Client.objects.count() == 0


class TestClientTags:
    def test_assign_tags_to_client(self, auth_client, user):
        client = Client.objects.create(name='Tag Client', email='tag@test.com', freelancer=user)
        tag = Tag.objects.create(name='Important', color='#FF0000', freelancer=user)
        response = auth_client.post(f'/api/v1/clients/{client.id}/tags/', {
            'tag_ids': [str(tag.id)],
        }, format='json')

        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['name'] == 'Important'


class TestTags:
    def test_create_tag(self, auth_client):
        response = auth_client.post('/api/v1/clients/tags/', {
            'name': 'VIP',
            'color': '#FFD700',
        }, format='json')

        assert response.status_code == 201
        assert response.data['name'] == 'VIP'

    def test_list_tags_scoped_to_user(self, auth_client, user):
        Tag.objects.create(name='Mine', color='#000', freelancer=user)
        response = auth_client.get('/api/v1/clients/tags/')

        assert response.status_code == 200
        assert len(response.data['results']) == 1

class TestClientSummary:
    def test_summary_returns_aggregates(self, auth_client, user):
        client = Client.objects.create(name='Summary Test', email='sum@test.com', freelancer=user)
        project = Project.objects.create(
            name='Sum Project', client=client, freelancer=user,
            billing_type='HOURLY', hourly_rate='50.00',
        )
        TimeEntry.objects.create(
            project=project, freelancer=user, date=timezone.now().date(),
            started_at=timezone.now(), duration_minutes=120, is_billable=True,
        )
        Invoice.objects.create(
            client=client, number='INV-001', issue_date=timezone.now().date(),
            due_date=timezone.now().date(), subtotal=5000, total=5000, status='PAID',
            paid_at=timezone.now(),
        )
        response = auth_client.get(f'/api/v1/clients/{client.id}/summary/')
        assert response.status_code == 200
        assert response.data['total_projects'] == 1
        assert response.data['total_hours'] == 2.0
        assert float(response.data['total_invoiced']) >= 5000
        assert float(response.data['total_paid']) >= 5000

class TestClientActivity:
    def test_activity_returns_logs(self, auth_client, user):
        client = Client.objects.create(name='Activity Test', email='act@test.com', freelancer=user)
        ActivityLog.objects.create(client=client, event_type='CLIENT_CREATED', description='Created')
        ActivityLog.objects.create(client=client, event_type='NOTE_ADDED', description='A note')
        response = auth_client.get(f'/api/v1/clients/{client.id}/activity/')
        assert response.status_code == 200
        assert len(response.data) == 3
        assert response.data[0]['event_type'] == 'NOTE_ADDED'

    def test_activity_scoped_to_client(self, auth_client, user, other_user):
        client = Client.objects.create(name='My Client', email='my@test.com', freelancer=user)
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        ActivityLog.objects.create(client=other_client, event_type='CLIENT_CREATED', description='Other log')
        response = auth_client.get(f'/api/v1/clients/{client.id}/activity/')
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]['event_type'] == 'CLIENT_CREATED'

class TestClientNotes:
    def test_add_note_creates_activity_log(self, auth_client, user):
        client = Client.objects.create(name='Note Test', email='note@test.com', freelancer=user)
        response = auth_client.post(f'/api/v1/clients/{client.id}/notes/', {
            'note': 'Important note about client',
        }, format='json')
        assert response.status_code == 201
        assert response.data['event_type'] == 'NOTE_ADDED'
        assert ActivityLog.objects.filter(client=client, event_type='NOTE_ADDED').count() == 1

    def test_add_empty_note_returns_400(self, auth_client, user):
        client = Client.objects.create(name='Empty Note', email='empty@test.com', freelancer=user)
        response = auth_client.post(f'/api/v1/clients/{client.id}/notes/', {
            'note': '',
        }, format='json')
        assert response.status_code == 400
