from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AccountsAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Regular User',
            password='StrongPass123!',
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            name='Admin User',
            password='StrongPass123!',
        )

    def authenticate_as_user(self):
        self.client.force_authenticate(user=self.user)

    def authenticate_as_admin(self):
        self.client.force_authenticate(user=self.admin)

    def test_register_creates_regular_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'name': 'New User',
                'email': 'new@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(email='new@example.com')
        self.assertEqual(created_user.role, User.Role.USER)
        self.assertFalse(created_user.is_staff)
        self.assertTrue(created_user.check_password('StrongPass123!'))

    def test_register_cannot_create_admin_user(self):
        response = self.client.post(
            reverse('register'),
            {
                'name': 'Fake Admin',
                'email': 'fakeadmin@example.com',
                'password': 'StrongPass123!',
                'role': User.Role.ADMIN,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(email='fakeadmin@example.com')
        self.assertEqual(created_user.role, User.Role.USER)
        self.assertFalse(created_user.is_staff)

    def test_login_returns_tokens(self):
        response = self.client.post(
            reverse('token_obtain_pair'),
            {
                'email': 'user@example.com',
                'password': 'StrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_me_requires_authentication(self):
        response = self.client.get(reverse('me'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_view_profile(self):
        self.authenticate_as_user()

        response = self.client.get(reverse('me'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_user_can_update_own_name(self):
        self.authenticate_as_user()

        response = self.client.patch(
            reverse('me'),
            {'name': 'Updated Name'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.name, 'Updated Name')

    def test_user_cannot_update_own_role(self):
        self.authenticate_as_user()

        response = self.client.patch(
            reverse('me'),
            {'role': User.Role.ADMIN},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.USER)

    def test_normal_user_cannot_list_users(self):
        self.authenticate_as_user()

        response = self.client.get(reverse('user-list'))

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_list_users(self):
        self.authenticate_as_admin()

        response = self.client.get(reverse('user-list'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_create_user(self):
        self.authenticate_as_admin()

        response = self.client.post(
            reverse('user-list'),
            {
                'name': 'Created By Admin',
                'email': 'created@example.com',
                'password': 'StrongPass123!',
                'role': User.Role.USER,
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(email='created@example.com')
        self.assertTrue(created_user.check_password('StrongPass123!'))
        self.assertEqual(created_user.role, User.Role.USER)

    def test_admin_created_admin_user_becomes_staff(self):
        self.authenticate_as_admin()

        response = self.client.post(
            reverse('user-list'),
            {
                'name': 'Created Admin',
                'email': 'createdadmin@example.com',
                'password': 'StrongPass123!',
                'role': User.Role.ADMIN,
                'is_active': True,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(email='createdadmin@example.com')
        self.assertEqual(created_user.role, User.Role.ADMIN)
        self.assertTrue(created_user.is_staff)

    def test_admin_can_update_user_role(self):
        self.authenticate_as_admin()

        response = self.client.patch(
            reverse('user-details', kwargs={'id': self.user.id}),
            {'role': User.Role.ADMIN},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Role.ADMIN)
        self.assertTrue(self.user.is_staff)

    def test_normal_user_cannot_access_admin_user_detail(self):
        self.authenticate_as_user()

        response = self.client.get(
            reverse('user-details', kwargs={'id': self.user.id}),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_change_password(self):
        self.authenticate_as_user()

        response = self.client.patch(
            reverse('change-password'),
            {
                'old_password': 'StrongPass123!',
                'new_password': 'NewStrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass123!'))

    def test_change_password_rejects_wrong_old_password(self):
        self.authenticate_as_user()

        response = self.client.patch(
            reverse('change-password'),
            {
                'old_password': 'WrongPassword123!',
                'new_password': 'NewStrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_can_deactivate_own_account(self):
        self.authenticate_as_user()

        response = self.client.delete(reverse("me"))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.user.refresh_from_db()
        self.assertFalse(self.user.is_active)