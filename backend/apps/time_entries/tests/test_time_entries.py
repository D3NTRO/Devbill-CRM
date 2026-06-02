import pytest
from django.utils import timezone
from apps.time_entries.models import TimeEntry
from apps.clients.models import Client
from apps.projects.models import Project

pytestmark = pytest.mark.django_db


@pytest.fixture
def project(auth_client, user):
    client = Client.objects.create(name='Timer Client', email='timer@test.com', freelancer=user)
    return Project.objects.create(
        name='Timer Project',
        client=client,
        freelancer=user,
        billing_type='HOURLY',
        hourly_rate='50.00',
    )


class TestTimerStart:
    def test_start_timer_creates_entry_without_end(self, auth_client, project):
        response = auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
            'description': 'Working on feature',
        }, format='json')

        assert response.status_code == 201
        assert response.data['ended_at'] is None
        assert response.data['description'] == 'Working on feature'
        assert response.data['project_name'] == project.name

    def test_start_timer_requires_project_id(self, auth_client):
        response = auth_client.post('/api/v1/time-entries/start/', {
            'description': 'No project',
        }, format='json')

        assert response.status_code == 400

    def test_start_timer_blocks_duplicate(self, auth_client, project):
        auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
            'description': 'First',
        }, format='json')

        response = auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
            'description': 'Second',
        }, format='json')

        assert response.status_code == 400
        assert 'Ya hay un timer activo' in response.data['error']


class TestTimerStop:
    def test_stop_timer_sets_ended_at(self, auth_client, project):
        start = auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
        }, format='json')
        entry_id = start.data['id']

        response = auth_client.post('/api/v1/time-entries/stop/', {
            'entry_id': entry_id,
        }, format='json')

        assert response.status_code == 200
        assert response.data['ended_at'] is not None
        assert response.data['duration_minutes'] is not None

    def test_stop_timer_without_entry_id_stops_running(self, auth_client, project):
        auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
        }, format='json')

        response = auth_client.post('/api/v1/time-entries/stop/', {}, format='json')

        assert response.status_code == 200
        assert response.data['ended_at'] is not None

    def test_stop_timer_when_none_running_returns_404(self, auth_client):
        response = auth_client.post('/api/v1/time-entries/stop/', {}, format='json')

        assert response.status_code == 404


class TestTimerRunning:
    def test_get_running_timer_returns_active_entry(self, auth_client, project):
        auth_client.post('/api/v1/time-entries/start/', {
            'project_id': project.id,
        }, format='json')

        response = auth_client.get('/api/v1/time-entries/running/')

        assert response.status_code == 200
        assert response.data['ended_at'] is None

    def test_get_running_timer_when_none_returns_404(self, auth_client):
        response = auth_client.get('/api/v1/time-entries/running/')

        assert response.status_code == 404

    def test_running_timer_scoped_to_user(self, auth_client, user, project, other_user):
        other_project = Project.objects.create(
            name='Other', client=Client.objects.create(name='OC', email='oc@b.com', freelancer=other_user),
            freelancer=other_user, billing_type='FIXED', fixed_price='100',
        )
        TimeEntry.objects.create(
            project=other_project, freelancer=other_user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get('/api/v1/time-entries/running/')
        assert response.status_code == 404
