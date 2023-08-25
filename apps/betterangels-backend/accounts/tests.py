from django.test import TestCase

from .models import BAUser


class BAUsersManagersTests(TestCase):
    def test_create_user(self):
        user = BAUser.objects.create_user(email="normal@user.com", password="foo")
        self.assertEqual(user.email, "normal@user.com")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

        try:
            # username is None for the AbstractBAUser option
            # username does not exist for the AbstractBaseBAUser option
            self.assertIsNone(user.username)  # type: ignore
        except AttributeError:
            pass
        with self.assertRaises(ValueError):
            BAUser.objects.create_user()
        with self.assertRaises(ValueError):
            BAUser.objects.create_user(email="")
        with self.assertRaises(ValueError):
            BAUser.objects.create_user(email="", password="foo")

    def test_create_superuser(self):
        admin_user = BAUser.objects.create_superuser(
            email="super@user.com", password="foo"
        )
        self.assertEqual(admin_user.email, "super@user.com")
        self.assertTrue(admin_user.is_active)
        self.assertTrue(admin_user.is_staff)
        self.assertTrue(admin_user.is_superuser)
        try:
            # username is None for the AbstractBAUser option
            # username does not exist for the AbstractBaseBAUser option
            self.assertIsNone(admin_user.username)  # type: ignore
        except AttributeError:
            pass
        with self.assertRaises(ValueError):
            BAUser.objects.create_superuser(
                email="super@user.com", password="foo", is_superuser=False
            )
