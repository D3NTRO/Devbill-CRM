import pytest
from apps.clients.models import Client
from apps.projects.models import Project

pytestmark = pytest.mark.django_db


@pytest.fixture
def client(auth_client, user):
    return Client.objects.create(name='Project Client', email='client@test.com', freelancer=user)


class TestProjectCreate:
    def test_create_project_success(self, auth_client, client):
        data = {
            'client': client.id,
            'name': 'New Project',
            'billing_type': 'FIXED',
            'fixed_price': '1500.00',
        }
        response = auth_client.post('/api/v1/projects/', data, format='json')

        assert response.status_code == 201
        assert response.data['name'] == 'New Project'
        assert response.data['pipeline_stage'] == 'LEAD'

    def test_create_project_defaults_to_lead_stage(self, auth_client, client):
        data = {'client': client.id, 'name': 'Lead Project', 'billing_type': 'HOURLY', 'hourly_rate': '50.00'}
        response = auth_client.post('/api/v1/projects/', data, format='json')

        assert response.status_code == 201
        assert response.data['pipeline_stage'] == 'LEAD'

    def test_create_project_validates_hourly_rate(self, auth_client, client):
        data = {'client': client.id, 'name': 'Bad Project', 'billing_type': 'HOURLY'}
        response = auth_client.post('/api/v1/projects/', data, format='json')

        assert response.status_code == 400

    def test_cannot_create_project_for_other_users_client(self, auth_client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        data = {'client': other_client.id, 'name': 'Hacked Project', 'billing_type': 'FIXED', 'fixed_price': '100'}
        response = auth_client.post('/api/v1/projects/', data, format='json')

        assert response.status_code == 400


class TestProjectList:
    def test_list_own_projects(self, auth_client, user, client):
        Project.objects.create(name='My Project', client=client, freelancer=user, billing_type='FIXED', fixed_price='100')
        response = auth_client.get('/api/v1/projects/')

        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_does_not_see_other_users_projects(self, auth_client, user, client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        Project.objects.create(name='Other Project', client=other_client, freelancer=other_user, billing_type='FIXED', fixed_price='100')
        Project.objects.create(name='My Project', client=client, freelancer=user, billing_type='FIXED', fixed_price='100')
        response = auth_client.get('/api/v1/projects/')

        names = [p['name'] for p in response.data['results']]
        assert 'Other Project' not in names
        assert 'My Project' in names


class TestPipeline:
    def test_list_pipeline_returns_grouped_projects(self, auth_client, user, client):
        Project.objects.create(name='Lead Project', client=client, freelancer=user, pipeline_stage='LEAD', billing_type='FIXED', fixed_price='100')
        Project.objects.create(name='Active Project', client=client, freelancer=user, pipeline_stage='ACTIVE', billing_type='FIXED', fixed_price='100')
        response = auth_client.get('/api/v1/projects/pipeline/')

        assert response.status_code == 200
        assert len(response.data['LEAD']) == 1
        assert len(response.data['ACTIVE']) == 1
        assert response.data['LEAD'][0]['name'] == 'Lead Project'

    def test_move_project_to_new_stage(self, auth_client, user, client):
        project = Project.objects.create(name='Move Me', client=client, freelancer=user, pipeline_stage='LEAD', billing_type='FIXED', fixed_price='100')
        response = auth_client.patch(f'/api/v1/projects/pipeline/{project.id}/move/', {
            'pipeline_stage': 'ACTIVE',
        }, format='json')

        assert response.status_code == 200
        assert response.data['pipeline_stage'] == 'ACTIVE'

    def test_reorder_projects(self, auth_client, user, client):
        p1 = Project.objects.create(name='First', client=client, freelancer=user, pipeline_stage='LEAD', column_order=0, billing_type='FIXED', fixed_price='100')
        p2 = Project.objects.create(name='Second', client=client, freelancer=user, pipeline_stage='LEAD', column_order=1, billing_type='FIXED', fixed_price='100')
        response = auth_client.post('/api/v1/projects/pipeline/reorder/', {
            'projects': [str(p2.id), str(p1.id)],
        }, format='json')

        assert response.status_code == 200
        p1.refresh_from_db()
        p2.refresh_from_db()
        assert p2.column_order == 0
        assert p1.column_order == 1

    def test_move_project_creates_activity_log(self, auth_client, user, client):
        project = Project.objects.create(name='Log Test', client=client, freelancer=user, pipeline_stage='LEAD', billing_type='FIXED', fixed_price='100')
        response = auth_client.patch(f'/api/v1/projects/pipeline/{project.id}/move/', {
            'pipeline_stage': 'ACTIVE',
        }, format='json')

        assert response.status_code == 200
        from apps.clients.models import ActivityLog
        assert ActivityLog.objects.filter(client=client, event_type='STAGE_CHANGED').exists()
