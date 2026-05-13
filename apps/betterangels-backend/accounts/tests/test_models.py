from accounts.models import User
from django.test import TestCase
from model_bakery import baker


class UserModelTestCase(TestCase):
    def test_str_method(self) -> None:
        user_with_name = baker.make(User, first_name="Dale", last_name="Cooper")
        user_without_name = baker.make(User)

        self.assertEqual(f"{user_with_name}", "Dale Cooper")
        self.assertEqual(f"{user_without_name}", f"{user_without_name.pk}")

    def test_full_name(self) -> None:
        user_1 = baker.make(User, first_name="Dale", middle_name=None, last_name="Cooper")
        self.assertEqual(user_1.full_name, "Dale Cooper")

        user_2 = baker.make(User, first_name="Dale", middle_name="Bartholomew", last_name="Cooper")
        self.assertEqual(user_2.full_name, "Dale Bartholomew Cooper")

    def test_save(self) -> None:
        user = baker.make(User, email="LOWERCASEME@EXAMPLE.COM")
        self.assertEqual(user.email, "lowercaseme@example.com")

        user.email = ""
        user.save()
        self.assertIsNone(user.email)
