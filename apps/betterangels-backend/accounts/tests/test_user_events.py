from accounts.models import User
from django.test import TestCase


class UserEventsTest(TestCase):
    def setUp(self) -> None:
        # Create a user instance
        self.user = User.objects.create(
            email="test@example.com",
            username="testuser",
            first_name="Test",
            last_name="User",
        )

    def test_user_event_creation_on_update(self) -> None:
        self.assertEqual(self.user.events.count(), 1)  # type: ignore[attr-defined]
        self.assertEqual(self.user.events.last().pgh_label, "user.add")  # type: ignore[attr-defined]

        # Update the user
        self.user.first_name = "Updated"
        self.user.save()

        # Check that a new event record was created
        self.assertEqual(self.user.events.count(), 2)  # type: ignore[attr-defined]

        # Check that the latest event record has the updated first name
        last_event = self.user.events.last()  # type: ignore[attr-defined]
        self.assertEqual(last_event.pgh_label, "user.update")
        self.assertEqual(last_event.first_name, "Updated")

    def test_user_event_record_on_deletion(self) -> None:
        # Delete the user
        user_id = self.user.pk
        self.user.delete()

        # NOTE: This model is automatically created and exposed by pghistory
        from accounts.models import UserEvent  # type: ignore[attr-defined]

        # Fetch the events for the deleted user
        deleted_user_events = UserEvent.objects.filter(id=user_id)
        self.assertEqual(deleted_user_events.count(), 2)

        # Check that the latest event record indicates the user was deleted
        self.assertEqual(deleted_user_events.last().pgh_label, "user.remove")
