from django.db.utils import IntegrityError
from django.test import TestCase

from ..models import User

# Tests inspired from here: https://learndjango.com/tutorials/django-custom-user-model


class UserManagerTestCase(TestCase):
    def test_create_user(self) -> None:
        user = User.objects.create_user(username="normal_user", email="normal@user.com", password="foo")
        self.assertEqual(user.username, "normal_user")
        self.assertEqual(user.email, "normal@user.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        # Attempt to create user with same username
        with self.assertRaises(IntegrityError):
            User.objects.create_user(username="normal_user", email="normal2@user.com", password="foo")

    def test_create_user_without_email(self) -> None:
        user = User.objects.create_user(username="normal_user", password="foo")
        self.assertEqual(user.username, "normal_user")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_username(self) -> None:
        with self.assertRaises(ValueError):
            User.objects.create_user(username=None, email="normal@user.com", password="foo")  # type: ignore[arg-type]

    def test_create_client(self) -> None:
        client_count = User.objects.count()
        client = User.objects.create_client()

        self.assertEqual(client.password[0], "!")
        self.assertEqual(User.objects.count(), client_count + 1)

    def test_create_superuser(self) -> None:
        admin_user = User.objects.create_superuser(username="superuser", email="super@user.com", password="foo")
        self.assertEqual(admin_user.username, "superuser")
        self.assertEqual(admin_user.email, "super@user.com")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                username="superuser", email="super2@user.com", password="foo", is_superuser=False
            )

    def test_create_superuser_without_email(self) -> None:
        admin_user = User.objects.create_superuser(username="superuser", password="foo")
        self.assertEqual(admin_user.username, "superuser")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
