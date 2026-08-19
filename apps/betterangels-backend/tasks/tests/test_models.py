from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
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
