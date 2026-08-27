from datetime import datetime, timezone

import time_machine
from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from notes.enums import ServiceRequestStatusEnum
from notes.models import Note, OrganizationService, ServiceRequest
from teams.models import Team


class ServiceRequestModelTestCase(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(User, email="test@example.com", username="testuser")

    @time_machine.travel("03-11-2024 10:11:12", tick=False)
    def test_save(self) -> None:
        """Verify that completed_on is populated correctly."""
        ebt_service = OrganizationService.objects.get(label="EBT")

        # Confirm that completed_on is set when a ServiceRequest is created as COMPLETED
        service_request_completed = ServiceRequest.objects.create(
            service=ebt_service,
            status=ServiceRequestStatusEnum.COMPLETED,
            created_by=self.user,
        )
        self.assertEqual(
            service_request_completed.completed_on,
            datetime(2024, 3, 11, 10, 11, 12, tzinfo=timezone.utc),
        )

        # Confirm that completed_on isn't set when a ServiceRequest is created as TO_DO
        service_request_to_do = ServiceRequest.objects.create(
            service=ebt_service,
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


class NoteTeamOrgValidationTestCase(TestCase):
    """A note's team must belong to the note's organization."""

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.own_team = baker.make(Team, organization=self.org)
        self.other_team = baker.make(Team, organization=self.other_org)

    def test_clean_allows_a_team_from_the_same_org(self) -> None:
        note = baker.make(Note, organization=self.org, team=self.own_team)

        note.clean()

    def test_clean_allows_no_team(self) -> None:
        note = baker.make(Note, organization=self.org, team=None)

        note.clean()

    def test_clean_rejects_a_team_from_another_org(self) -> None:
        # Unsaved: #2312 adds a composite FK that makes the row unstorable.
        note = Note(organization=self.org, team=self.other_team)

        with self.assertRaises(ValidationError) as ctx:
            note.clean()

        self.assertIn("team", ctx.exception.message_dict)
