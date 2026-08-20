from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.db import IntegrityError, connection, transaction
from django.test import TestCase
from model_bakery import baker
from tasks.models import Task
from teams.models import Team


class TaskTeamOrgValidationTestCase(TestCase):
    """A task's team must belong to the task's organization."""

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.own_team = baker.make(Team, organization=self.org)
        self.other_team = baker.make(Team, organization=self.other_org)

    def test_clean_allows_a_team_from_the_same_org(self) -> None:
        task = baker.make(Task, organization=self.org, team=self.own_team)

        task.clean()

    def test_clean_allows_no_team(self) -> None:
        task = baker.make(Task, organization=self.org, team=None)

        task.clean()

    def test_clean_rejects_a_team_from_another_org(self) -> None:
        # Unsaved: #2312 adds a composite FK that makes the row unstorable.
        task = Task(organization=self.org, team=self.other_team)

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("team", ctx.exception.message_dict)

    def test_clean_allows_an_org_less_task_without_a_team(self) -> None:
        # Deleting an organization nulls both columns, so this is the only
        # org-less shape that exists; it has to stay editable in the admin.
        task = baker.make(Task, organization=None, team=None)

        task.clean()

    def test_clean_rejects_a_team_on_an_org_less_task(self) -> None:
        task = baker.make(Task, organization=None, team=None)
        task.team = self.other_team

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("team", ctx.exception.message_dict)


class TaskTeamOrgConstraintTestCase(TestCase):
    """The rule holds for writers that never reach ``clean()``."""

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.own_team = baker.make(Team, organization=self.org)
        self.other_team = baker.make(Team, organization=self.other_org)

    def _check_deferred_constraints(self) -> None:
        # The composite FK is deferred, so Postgres checks it at commit -- which
        # a test transaction never reaches.
        with connection.cursor() as cursor:
            cursor.execute("SET CONSTRAINTS ALL IMMEDIATE")

    def test_queryset_update_cannot_store_a_cross_org_team(self) -> None:
        task = baker.make(Task, organization=self.org, team=self.own_team)

        with self.assertRaises(IntegrityError), transaction.atomic():
            Task.objects.filter(pk=task.pk).update(team=self.other_team)
            self._check_deferred_constraints()

    def test_queryset_update_still_allows_a_team_from_the_same_org(self) -> None:
        task = baker.make(Task, organization=self.org, team=None)

        with transaction.atomic():
            Task.objects.filter(pk=task.pk).update(team=self.own_team)
            self._check_deferred_constraints()

        task.refresh_from_db()
        self.assertEqual(task.team, self.own_team)

    def test_an_org_less_task_is_outside_the_constraint(self) -> None:
        """MATCH SIMPLE: a NULL in either column satisfies the composite FK.

        Deleting an organization nulls ``organization_id``, and that row must
        stay storable. ``clean()`` is what rejects this shape.
        """
        task = baker.make(Task, organization=None, team=None)

        with transaction.atomic():
            Task.objects.filter(pk=task.pk).update(team=self.other_team)
            self._check_deferred_constraints()

        task.refresh_from_db()
        self.assertEqual(task.team, self.other_team)
