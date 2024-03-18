from accounts.models import User
from django.test import TestCase


class UserHistoryTest(TestCase):
    def setUp(self) -> None:
        # Create a user instance
        self.user = User.objects.create(
            email="test@example.com",
            username="testuser",
            first_name="Test",
            last_name="User",
        )

    def test_user_history_creation_on_update(self) -> None:
        # Initial history count should be 1
        self.assertEqual(self.user.history.count(), 1)

        # Update the user
        self.user.first_name = "Updated"
        self.user.save()

        # Check that a new history record was created
        self.assertEqual(self.user.history.count(), 2)

        # Check that the latest history record has the updated first name
        latest_history = self.user.history.first()
        self.assertEqual(latest_history.first_name, "Updated")

    def test_user_history_record_on_deletion(self) -> None:
        # Check initial history count is 1
        self.assertEqual(self.user.history.count(), 1)

        # Delete the user
        user_id = self.user.pk
        self.user.delete()

        # Fetch the history for the deleted user
        deleted_user_history = User.history.filter(id=user_id)

        # Check that a history record still exists for the deleted user
        self.assertEqual(deleted_user_history.count(), 2)

        # Check that the latest history record indicates the user was deleted
        latest_history = deleted_user_history.first()
        self.assertTrue(latest_history.history_type == "-")
