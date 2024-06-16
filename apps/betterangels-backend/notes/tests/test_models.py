from datetime import datetime, timedelta, timezone

import time_machine
from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from notes.enums import DueByGroupEnum, ServiceEnum, ServiceRequestStatusEnum
from notes.models import ServiceRequest, Task


class ServiceRequestModelTest(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User, email="test@example.com", username="testuser")

    @time_machine.travel("03-11-2024 10:11:12", tick=False)
    def test_save(self) -> None:
        """Verify that completed_on is populated correctly."""
        # Confirm that completed_on is set when a ServiceRequest is created as COMPLETED
        service_request_completed = ServiceRequest.objects.create(
            service=ServiceEnum.BLANKET,
            status=ServiceRequestStatusEnum.COMPLETED,
            created_by=self.user,
        )
        self.assertEqual(
            service_request_completed.completed_on,
            datetime(2024, 3, 11, 10, 11, 12, tzinfo=timezone.utc),
        )

        # Confirm that completed_on isn't set when a ServiceRequest is created as TO_DO
        service_request_to_do = ServiceRequest.objects.create(
            service=ServiceEnum.BLANKET,
            status=ServiceRequestStatusEnum.TO_DO,
            created_by=self.user,
        )
        self.assertIsNone(service_request_to_do.completed_on)

        # Confirm that completed_on is set when ServiceRequest is marked COMPLETED
        service_request_to_do.status = ServiceRequestStatusEnum.COMPLETED
        service_request_to_do.save()
        service_request_to_do.refresh_from_db()
        self.assertEqual(
            service_request_to_do.completed_on,
            datetime(2024, 3, 11, 10, 11, 12, tzinfo=timezone.utc),
        )


class TaskModelTest(TestCase):
    @time_machine.travel("06-01-2024 10:11:12", tick=False)
    def test_due_by_group(self) -> None:
        """Verify that due_by_group is populated correctly."""

        # On 06/01/2024, create Task due on 06/09/2024
        self.task = baker.make(Task, due_by=datetime(2024, 6, 9, 10, 11, 12, tzinfo=timezone.utc))
        self.assertEqual(self.task.due_by_group, DueByGroupEnum.FUTURE_TASKS)

        with time_machine.travel(datetime.now(), tick=False) as traveller:
            # Advance time to 06/02/2024
            traveller.shift(timedelta(days=1))
            self.assertEqual(self.task.due_by_group, DueByGroupEnum.IN_THE_NEXT_WEEK)

            # Advance time to 06/07/2024
            traveller.shift(timedelta(days=5))
            self.assertEqual(self.task.due_by_group, DueByGroupEnum.IN_THE_NEXT_WEEK)

            # Advance time to 06/08/2024
            traveller.shift(timedelta(days=1))
            self.assertEqual(self.task.due_by_group, DueByGroupEnum.TOMORROW)

            # Advance time to 06/09/2024
            traveller.shift(timedelta(days=1))
            self.assertEqual(self.task.due_by_group, DueByGroupEnum.TODAY)

            # Advance time to 06/10/2024
            traveller.shift(timedelta(days=1))
            self.assertEqual(self.task.due_by_group, DueByGroupEnum.OVERDUE)
