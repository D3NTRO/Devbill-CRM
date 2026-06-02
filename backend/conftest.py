import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user_data():
    return {
        'email': 'test@example.com',
        'password': 'testpass123',
        'first_name': 'Test',
        'last_name': 'User',
    }


@pytest.fixture
def user(user_data):
    return User.objects.create_user(
        username=user_data['email'],
        email=user_data['email'],
        password=user_data['password'],
        first_name=user_data['first_name'],
        last_name=user_data['last_name'],
    )


@pytest.fixture
def auth_client(api_client, user, user_data):
    response = api_client.post('/api/v1/auth/login/', {
        'email': user_data['email'],
        'password': user_data['password'],
    })
    token = response.data['access']
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    return api_client


@pytest.fixture
def other_user():
    return User.objects.create_user(
        username='other@example.com',
        email='other@example.com',
        password='otherpass123',
    )
