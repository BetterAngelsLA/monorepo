from datetime import datetime, timedelta, timezone

import time_machine
from accounts.models import User
from django.test import TestCase
from model_bakery import baker
from notes.enums import ServiceEnum, ServiceRequestStatusEnum, TaskDueWithinEnum
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
    @time_machine.travel("06-16-2024 10:11:12", tick=False)
    def test_due_within(self) -> None:
        """Verify that due_within is populated correctly."""

        # On 6/16/2024, create Task due on 6/24/2024
        self.task = baker.make(Task, due_by=datetime(2024, 6, 24, 10, 11, 12, tzinfo=timezone.utc))
        self.assertEqual(self.task.due_within, TaskDueWithinEnum.FUTURE_TASKS)

        # Advance time to 6/17/2024. Task should be due "in the next week"
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=1))

            self.assertEqual(self.task.due_within, TaskDueWithinEnum.IN_THE_NEXT_WEEK)

        # Advance time to 6/23/2024. Task should be due "in the next week"
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=7))

            self.assertEqual(self.task.due_within, TaskDueWithinEnum.IN_THE_NEXT_WEEK)

        # Advance time to 6/24/2024. Task should be due "today"
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=8))

            self.assertEqual(self.task.due_within, TaskDueWithinEnum.TODAY)

        # Advance time to 6/25/2024. Task should be "overdue"
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=9))

            self.assertEqual(self.task.due_within, TaskDueWithinEnum.OVERDUE)
