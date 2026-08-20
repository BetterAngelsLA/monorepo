"""Tests for task services — what the API rejects before it reaches Postgres."""

from accounts.models import PermissionGroup, User
from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from tasks.models import Task
from tasks.services import task_create, task_update
from teams.models import Team


class TaskCreateValidationTestCase(TestCase):
    """``task_create`` validates the instance before saving it."""

    def setUp(self) -> None:
        self.organization = organization_recipe.make()
        self.permission_group = PermissionGroup.objects.create(
            organization=self.organization, name="task-service-group"
        )
        self.user = baker.make(User)

    def _create(self, **item: object) -> list[Task]:
        return task_create(user=self.user, permission_group=self.permission_group, data=[{**item}])

    def test_a_summary_over_the_field_length_is_rejected(self) -> None:
        """Unvalidated this reached Postgres as a DataError — a 500 rather than a message."""
        with self.assertRaises(ValidationError) as ctx:
            self._create(summary="x" * 101)

        self.assertIn("summary", ctx.exception.message_dict)

    def test_a_summary_at_the_field_length_is_accepted(self) -> None:
        tasks = self._create(summary="x" * 100)

        self.assertEqual(len(tasks), 1)

    def test_a_blank_summary_is_rejected(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            self._create(summary="")

        self.assertIn("summary", ctx.exception.message_dict)

    def test_a_team_from_another_organization_is_rejected(self) -> None:
        other_team = baker.make(Team, organization=organization_recipe.make())

        with self.assertRaises(ValidationError) as ctx:
            self._create(summary="Cross-org", team_id=other_team.pk)

        self.assertIn("team", ctx.exception.message_dict)


class TaskUpdateValidationTestCase(TestCase):
    """``task_update`` validates the instance before saving it."""

    def setUp(self) -> None:
        self.organization = organization_recipe.make()
        self.task = baker.make(Task, organization=self.organization, team=None, summary="Original")

    def test_a_summary_over_the_field_length_is_rejected(self) -> None:
        with self.assertRaises(ValidationError) as ctx:
            task_update(task=self.task, data={"summary": "x" * 101})

        self.assertIn("summary", ctx.exception.message_dict)
        self.assertEqual(Task.objects.get(pk=self.task.pk).summary, "Original")

    def test_a_team_from_another_organization_is_rejected(self) -> None:
        other_team = baker.make(Team, organization=organization_recipe.make())

        with self.assertRaises(ValidationError) as ctx:
            task_update(task=self.task, data={"team_id": other_team.pk})

        self.assertIn("team", ctx.exception.message_dict)
        self.assertIsNone(Task.objects.get(pk=self.task.pk).team_id)

    def test_a_task_whose_organization_was_deleted_can_still_be_updated(self) -> None:
        """``organization`` is SET_NULL, so null is a shape that exists and must stay editable."""
        self.organization.delete()
        self.task.refresh_from_db()

        task_update(task=self.task, data={"summary": "Amended"})

        self.assertEqual(Task.objects.get(pk=self.task.pk).summary, "Amended")
