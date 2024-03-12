from datetime import datetime, timezone

from accounts.models import User
from django.test import TestCase
from freezegun import freeze_time
from model_bakery import baker
from notes.enums import ServiceEnum, ServiceRequestStatusEnum
from notes.models import ServiceRequest


class ServiceRequestModelTest(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User, email="test@example.com", username="testuser")

    @freeze_time("03-11-2024 10:11:12")
    def test_set_completed_on(self) -> None:
        """Verify that completed_on is populated correctly."""
        service_request = ServiceRequest.objects.create(
            service=ServiceEnum.BLANKET,
            status=ServiceRequestStatusEnum.TO_DO,
            created_by=self.user,
        )

        # Confirm that completed_on isn't set when a ServiceRequest is created as TO_DO
        self.assertIsNone(service_request.completed_on)

        service_request.status = ServiceRequestStatusEnum.COMPLETED
        service_request.save()
        service_request.refresh_from_db()

        # Confirm that completed_on is set when ServiceRequest is marked COMPLETED
        self.assertEqual(
            service_request.completed_on,
            datetime(2024, 3, 11, 10, 11, 12, tzinfo=timezone.utc),
        )

        service_request_completed = ServiceRequest.objects.create(
            service=ServiceEnum.BLANKET,
            status=ServiceRequestStatusEnum.COMPLETED,
            created_by=self.user,
        )

        # Confirm that completed_on is set when a ServiceRequest is created as COMPLETED
        self.assertEqual(
            service_request_completed.completed_on,
            datetime(2024, 3, 11, 10, 11, 12, tzinfo=timezone.utc),
        )
