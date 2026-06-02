import pytest
from django.contrib.auth import get_user_model

User = get_user_model()

pytestmark = pytest.mark.django_db


class TestRegister:
    def test_register_creates_user_and_returns_tokens(self, api_client):
        data = {
            'email': 'new@example.com',
            'password': 'securepass123',
            'first_name': 'New',
            'last_name': 'User',
        }
        response = api_client.post('/api/v1/auth/register/', data)

        assert response.status_code == 201
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == 'new@example.com'

    def test_register_creates_freelancer_profile(self, api_client):
        data = {
            'email': 'profile@example.com',
            'password': 'securepass123',
        }
        response = api_client.post('/api/v1/auth/register/', data)

        assert response.status_code == 201
        user = User.objects.get(email='profile@example.com')
        assert hasattr(user, 'freelancer_profile')
        assert user.freelancer_profile.invoice_prefix == 'INV'

    def test_register_with_duplicate_email_fails(self, api_client, user):
        data = {
            'email': user.email,
            'password': 'securepass123',
        }
        response = api_client.post('/api/v1/auth/register/', data)

        assert response.status_code == 400

    def test_register_with_short_password_fails(self, api_client):
        data = {
            'email': 'short@example.com',
            'password': '1234567',
        }
        response = api_client.post('/api/v1/auth/register/', data)

        assert response.status_code == 400


class TestLogin:
    def test_login_with_valid_credentials_returns_tokens(self, api_client, user, user_data):
        response = api_client.post('/api/v1/auth/login/', {
            'email': user_data['email'],
            'password': user_data['password'],
        })

        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == user_data['email']

    def test_login_with_wrong_password_returns_401(self, api_client, user, user_data):
        response = api_client.post('/api/v1/auth/login/', {
            'email': user_data['email'],
            'password': 'wrongpassword',
        })

        assert response.status_code == 401

    def test_login_with_nonexistent_email_returns_401(self, api_client):
        response = api_client.post('/api/v1/auth/login/', {
            'email': 'nobody@example.com',
            'password': 'somepass123',
        })

        assert response.status_code == 401


class TestMe:
    def test_me_returns_authenticated_user(self, auth_client, user):
        response = auth_client.get('/api/v1/auth/me/')

        assert response.status_code == 200
        assert response.data['email'] == user.email

    def test_me_without_auth_returns_401(self, api_client):
        response = api_client.get('/api/v1/auth/me/')

        assert response.status_code == 401

    def test_me_patch_updates_profile(self, auth_client):
        response = auth_client.patch('/api/v1/auth/me/', {
            'first_name': 'Updated',
        }, format='json')

        assert response.status_code == 200
        assert response.data['first_name'] == 'Updated'

    def test_me_delete_removes_user(self, auth_client):
        response = auth_client.delete('/api/v1/auth/me/')

        assert response.status_code == 204

    def test_token_refresh(self, api_client, user, user_data):
        login_resp = api_client.post('/api/v1/auth/login/', {
            'email': user_data['email'],
            'password': user_data['password'],
        })
        refresh_token = login_resp.data['refresh']

        response = api_client.post('/api/v1/auth/refresh/', {
            'refresh': refresh_token,
        })

        assert response.status_code == 200
        assert 'access' in response.data
