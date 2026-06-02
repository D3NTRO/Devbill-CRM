import pytest
from decimal import Decimal
from apps.clients.models import Client, ActivityLog
from apps.projects.models import Project
from apps.proposals.models import Proposal

pytestmark = pytest.mark.django_db

@pytest.fixture
def client(user):
    return Client.objects.create(name='Prop Client', email='prop@test.com', freelancer=user)

@pytest.fixture
def project(user, client):
    return Project.objects.create(
        name='Prop Project',
        client=client,
        freelancer=user,
        billing_type='FIXED',
        fixed_price='5000.00',
    )

class TestProposalCreate:
    def test_create_proposal_with_items(self, auth_client, project):
        data = {
            'project': str(project.id),
            'title': 'Website Redesign',
            'description': 'Complete redesign proposal',
            'items': [
                {'description': 'Design', 'quantity': 1, 'unit_price': 2000},
                {'description': 'Development', 'quantity': 1, 'unit_price': 3000},
            ],
            'valid_until': '2026-07-01',
        }
        response = auth_client.post('/api/v1/proposals/', data, format='json')
        assert response.status_code == 201
        assert response.data['title'] == 'Website Redesign'
        assert Decimal(response.data['total']) == Decimal('5000.00')
        assert Proposal.objects.count() == 1

    def test_create_proposal_fails_without_project(self, auth_client):
        response = auth_client.post('/api/v1/proposals/', {
            'title': 'No Project',
            'valid_until': '2026-07-01',
        }, format='json')
        assert response.status_code == 400

class TestProposalList:
    def test_list_own_proposals(self, auth_client, user, project):
        Proposal.objects.create(project=project, title='My Prop', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get('/api/v1/proposals/')
        assert response.status_code == 200
        assert len(response.data['results']) == 1

    def test_filter_by_status(self, auth_client, user, project):
        Proposal.objects.create(project=project, title='Draft', status='DRAFT', items=[], total=100, valid_until='2026-07-01')
        Proposal.objects.create(project=project, title='Sent', status='SENT', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get('/api/v1/proposals/?status=DRAFT')
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'Draft'

    def test_filter_by_project(self, auth_client, user, project):
        other = Project.objects.create(
            name='Other', client=project.client, freelancer=user,
            billing_type='FIXED', fixed_price='100',
        )
        Proposal.objects.create(project=project, title='Main', items=[], total=100, valid_until='2026-07-01')
        Proposal.objects.create(project=other, title='Other Prop', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get(f'/api/v1/proposals/?project={project.id}')
        titles = [p['title'] for p in response.data['results']]
        assert 'Main' in titles
        assert 'Other Prop' not in titles

    def test_does_not_see_other_users_proposals(self, auth_client, user, project, other_user):
        other_client = Client.objects.create(name='Other Client', email='other@b.com', freelancer=other_user)
        other_project = Project.objects.create(
            name='Other Project', client=other_client, freelancer=other_user,
            billing_type='FIXED', fixed_price='100',
        )
        Proposal.objects.create(project=other_project, title='Other Prop', items=[], total=100, valid_until='2026-07-01')
        Proposal.objects.create(project=project, title='My Prop', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get('/api/v1/proposals/')
        titles = [p['title'] for p in response.data['results']]
        assert 'Other Prop' not in titles
        assert 'My Prop' in titles

class TestProposalDetail:
    def test_get_proposal_detail(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='Detail', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get(f'/api/v1/proposals/{proposal.id}/')
        assert response.status_code == 200
        assert response.data['title'] == 'Detail'

    def test_cannot_access_other_users_proposal(self, auth_client, other_user):
        other_client = Client.objects.create(name='Other', email='o@b.com', freelancer=other_user)
        other_project = Project.objects.create(
            name='Other', client=other_client, freelancer=other_user,
            billing_type='FIXED', fixed_price='100',
        )
        proposal = Proposal.objects.create(project=other_project, title='Secret', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get(f'/api/v1/proposals/{proposal.id}/')
        assert response.status_code == 404

    def test_update_proposal(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='Old Title', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.patch(f'/api/v1/proposals/{proposal.id}/', {'title': 'New Title'}, format='json')
        assert response.status_code == 200
        assert response.data['title'] == 'New Title'

    def test_delete_proposal(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='Delete', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.delete(f'/api/v1/proposals/{proposal.id}/')
        assert response.status_code == 204
        assert Proposal.objects.count() == 0

class TestProposalActions:
    def test_mark_sent_updates_status_and_creates_activity(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='To Send', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.post(f'/api/v1/proposals/{proposal.id}/mark_sent/')
        assert response.status_code == 200
        assert response.data['status'] == 'SENT'
        assert ActivityLog.objects.filter(client=project.client, event_type='PROPOSAL_SENT').exists()

    def test_accept_updates_status_and_moves_project(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='To Accept', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.post(f'/api/v1/proposals/{proposal.id}/accept/')
        assert response.status_code == 200
        assert response.data['status'] == 'ACCEPTED'
        project.refresh_from_db()
        assert project.pipeline_stage == 'ACTIVE'
        assert ActivityLog.objects.filter(client=project.client, event_type='PROPOSAL_ACCEPTED').exists()

    def test_pdf_action_returns_info(self, auth_client, project):
        proposal = Proposal.objects.create(project=project, title='PDF Test', items=[], total=100, valid_until='2026-07-01')
        response = auth_client.get(f'/api/v1/proposals/{proposal.id}/pdf/')
        assert response.status_code == 200
        assert 'proposal_id' in response.data
