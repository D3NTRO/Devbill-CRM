import pytest
from django.utils import timezone
from apps.time_entries.models import TimeEntry
from apps.clients.models import Client
from apps.projects.models import Project

pytestmark = pytest.mark.django_db


@pytest.fixture
def project(user):
    client = Client.objects.create(name='Timer Client', email='timer@test.com', freelancer=user)
    return Project.objects.create(
        name='Timer Project',
        client=client,
        freelancer=user,
        billing_type='HOURLY',
        hourly_rate='50.00',
    )


@pytest.fixture
def other_project(other_user):
    client = Client.objects.create(name='Other Client', email='other@test.com', freelancer=other_user)
    return Project.objects.create(
        name='Other Project',
        client=client,
        freelancer=other_user,
        billing_type='HOURLY',
        hourly_rate='75.00',
    )


# ─── Timer Start ───────────────────────────────────────────────

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


# ─── Timer Stop ────────────────────────────────────────────────

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


# ─── Timer Running ─────────────────────────────────────────────

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

    def test_running_timer_scoped_to_user(self, auth_client, user, project, other_user, other_project):
        TimeEntry.objects.create(
            project=other_project, freelancer=other_user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get('/api/v1/time-entries/running/')
        assert response.status_code == 404


# ─── Manual Entry CRUD ─────────────────────────────────────────

class TestCreateManualEntry:
    def test_create_minimal(self, auth_client, project):
        response = auth_client.post('/api/v1/time-entries/', {
            'project': project.id,
        }, format='json')

        assert response.status_code == 201
        assert response.data['started_at'] is not None
        assert response.data['date'] is not None
        assert response.data['is_billable'] is True
        assert response.data['duration_minutes'] is None

    def test_create_with_duration(self, auth_client, project):
        now = timezone.now()
        later = now + timezone.timedelta(hours=2)
        response = auth_client.post('/api/v1/time-entries/', {
            'project': project.id,
            'description': 'Reunión con cliente',
            'started_at': now.isoformat(),
            'ended_at': later.isoformat(),
            'is_billable': True,
        }, format='json')

        assert response.status_code == 201
        assert response.data['description'] == 'Reunión con cliente'
        assert response.data['duration_minutes'] == 120

    def test_create_non_billable(self, auth_client, project):
        response = auth_client.post('/api/v1/time-entries/', {
            'project': project.id,
            'is_billable': False,
        }, format='json')

        assert response.status_code == 201
        assert response.data['is_billable'] is False

    def test_create_requires_project(self, auth_client):
        response = auth_client.post('/api/v1/time-entries/', {}, format='json')
        assert response.status_code == 400

    def test_create_sets_freelancer(self, auth_client, user, project):
        response = auth_client.post('/api/v1/time-entries/', {
            'project': project.id,
        }, format='json')

        entry = TimeEntry.objects.first()
        assert entry.freelancer == user

    def test_unauthenticated_cannot_create(self, api_client, project):
        response = api_client.post('/api/v1/time-entries/', {
            'project': project.id,
        }, format='json')
        assert response.status_code == 401

    def test_create_ended_at_before_started_at_fails(self, auth_client, project):
        now = timezone.now()
        earlier = now - timezone.timedelta(hours=1)
        response = auth_client.post('/api/v1/time-entries/', {
            'project': project.id,
            'started_at': now.isoformat(),
            'ended_at': earlier.isoformat(),
        }, format='json')
        assert response.status_code == 400


class TestListEntries:
    def test_list_all(self, auth_client, user, project):
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get('/api/v1/time-entries/')
        assert response.status_code == 200
        assert len(response.data['results']) == 2

    def test_list_only_own(self, auth_client, user, project, other_user, other_project):
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )
        TimeEntry.objects.create(
            project=other_project, freelancer=other_user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get('/api/v1/time-entries/')
        assert len(response.data['results']) == 1


class TestFilterEntries:
    def test_filter_by_project(self, auth_client, user, project):
        e1 = TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )
        other_p = Project.objects.create(
            name='Other', client=project.client, freelancer=user,
            billing_type='FIXED', fixed_price='100',
        )
        TimeEntry.objects.create(
            project=other_p, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get(f'/api/v1/time-entries/?project={e1.project_id}')
        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_filter_by_billable(self, auth_client, user, project):
        TimeEntry.objects.create(
            project=project, freelancer=user, is_billable=True,
            started_at=timezone.now(), date=timezone.now().date(),
        )
        TimeEntry.objects.create(
            project=project, freelancer=user, is_billable=False,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.get('/api/v1/time-entries/?is_billable=true')
        assert len(response.data['results']) == 1

        response = auth_client.get('/api/v1/time-entries/?is_billable=false')
        assert len(response.data['results']) == 1

    def test_filter_by_running(self, auth_client, user, project):
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
            ended_at=timezone.now(), duration_minutes=30,
        )

        response = auth_client.get('/api/v1/time-entries/?running=true')
        assert len(response.data['results']) == 1

        response = auth_client.get('/api/v1/time-entries/?running=false')
        assert len(response.data['results']) == 1

    def test_filter_by_date_range(self, auth_client, user, project):
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date='2026-01-01',
        )
        TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date='2026-06-01',
        )

        response = auth_client.get('/api/v1/time-entries/?date_from=2026-05-01&date_to=2026-07-01')
        assert len(response.data['results']) == 1


class TestUpdateEntry:
    def test_update_description(self, auth_client, user, project):
        entry = TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.patch(f'/api/v1/time-entries/{entry.id}/', {
            'description': 'Actualizada',
        }, format='json')

        assert response.status_code == 200
        assert response.data['description'] == 'Actualizada'

    def test_cannot_update_other_entry(self, auth_client, other_user, other_project):
        entry = TimeEntry.objects.create(
            project=other_project, freelancer=other_user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.patch(f'/api/v1/time-entries/{entry.id}/', {
            'description': 'Hack',
        }, format='json')

        assert response.status_code == 404


class TestDeleteEntry:
    def test_delete_entry(self, auth_client, user, project):
        entry = TimeEntry.objects.create(
            project=project, freelancer=user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.delete(f'/api/v1/time-entries/{entry.id}/')
        assert response.status_code == 204
        assert TimeEntry.objects.count() == 0

    def test_cannot_delete_other_entry(self, auth_client, other_user, other_project):
        entry = TimeEntry.objects.create(
            project=other_project, freelancer=other_user,
            started_at=timezone.now(), date=timezone.now().date(),
        )

        response = auth_client.delete(f'/api/v1/time-entries/{entry.id}/')
        assert response.status_code == 404
        assert TimeEntry.objects.count() == 1
