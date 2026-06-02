import pytest
from django.utils import timezone
from rest_framework import status
from apps.tasks.models import Task

pytestmark = pytest.mark.django_db


class TestTaskCreate:
    def test_create_task_success(self, auth_client):
        data = {'title': 'Preparar informe mensual'}
        response = auth_client.post('/api/v1/tasks/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['title'] == 'Preparar informe mensual'
        assert response.data['status'] == 'PENDING'
        assert response.data['priority'] == 'MEDIUM'
        assert Task.objects.count() == 1

    def test_create_task_requires_title(self, auth_client):
        response = auth_client.post('/api/v1/tasks/', {})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_task_with_all_fields(self, auth_client):
        now = timezone.now().isoformat()
        data = {
            'title': 'Llamar al cliente',
            'status': 'IN_PROGRESS',
            'priority': 'HIGH',
            'due_date': now,
        }
        response = auth_client.post('/api/v1/tasks/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['status'] == 'IN_PROGRESS'
        assert response.data['priority'] == 'HIGH'

    def test_create_task_sets_freelancer(self, auth_client, user):
        response = auth_client.post('/api/v1/tasks/', {'title': 'Mi tarea'})
        assert response.status_code == status.HTTP_201_CREATED
        task = Task.objects.first()
        assert task.freelancer == user

    def test_unauthenticated_cannot_create(self, api_client):
        response = api_client.post('/api/v1/tasks/', {'title': 'Tarea'})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestTaskList:
    def test_list_tasks(self, auth_client, user):
        Task.objects.create(freelancer=user, title='Tarea 1')
        Task.objects.create(freelancer=user, title='Tarea 2')
        response = auth_client.get('/api/v1/tasks/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 2

    def test_list_only_own_tasks(self, auth_client, user, other_user):
        Task.objects.create(freelancer=user, title='Mi tarea')
        Task.objects.create(freelancer=other_user, title='Otra tarea')
        response = auth_client.get('/api/v1/tasks/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) == 1
        assert response.data['results'][0]['title'] == 'Mi tarea'


class TestTaskDetail:
    def test_get_task(self, auth_client, user):
        task = Task.objects.create(freelancer=user, title='Detalle')
        response = auth_client.get(f'/api/v1/tasks/{task.id}/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Detalle'

    def test_cannot_get_other_task(self, auth_client, other_user):
        task = Task.objects.create(freelancer=other_user, title='Secreto')
        response = auth_client.get(f'/api/v1/tasks/{task.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTaskUpdate:
    def test_update_task(self, auth_client, user):
        task = Task.objects.create(freelancer=user, title='Original')
        response = auth_client.patch(f'/api/v1/tasks/{task.id}/', {'title': 'Actualizado', 'status': 'DONE'})
        assert response.status_code == status.HTTP_200_OK
        assert response.data['title'] == 'Actualizado'
        assert response.data['status'] == 'DONE'

    def test_cannot_update_other_task(self, auth_client, other_user):
        task = Task.objects.create(freelancer=other_user, title='Ajeno')
        response = auth_client.patch(f'/api/v1/tasks/{task.id}/', {'title': 'Hackeado'})
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestTaskDelete:
    def test_delete_task(self, auth_client, user):
        task = Task.objects.create(freelancer=user, title='Para borrar')
        response = auth_client.delete(f'/api/v1/tasks/{task.id}/')
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert Task.objects.count() == 0

    def test_cannot_delete_other_task(self, auth_client, other_user):
        task = Task.objects.create(freelancer=other_user, title='Ajeno')
        response = auth_client.delete(f'/api/v1/tasks/{task.id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert Task.objects.count() == 1
