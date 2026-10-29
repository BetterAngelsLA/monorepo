from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker

from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
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


class TaskAssigneeOrgValidationTestCase(TestCase):
    """A task's assignee must be a member of the task's organization."""

    def setUp(self) -> None:
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.member = baker.make(User)
        self.outsider = baker.make(User)
        self.org.add_user(self.member)
        self.other_org.add_user(self.outsider)

    def test_clean_allows_an_assignee_from_the_same_org(self) -> None:
        task = Task(organization=self.org, assignee=self.member)

        task.clean()

    def test_clean_allows_no_assignee(self) -> None:
        task = Task(organization=self.org, assignee=None)

        task.clean()

    def test_clean_rejects_an_assignee_from_another_org(self) -> None:
        task = Task(organization=self.org, assignee=self.outsider)

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("assignee", ctx.exception.message_dict)

    def test_clean_allows_an_org_less_task_without_an_assignee(self) -> None:
        # Deleting an organization nulls the column, so this is the only
        # org-less shape that exists; it has to stay editable in the admin.
        task = baker.make(Task, organization=None, assignee=None)

        task.clean()

    def test_clean_rejects_an_assignee_on_a_new_org_less_task(self) -> None:
        task = Task(organization=None, assignee=self.member)

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("assignee", ctx.exception.message_dict)

    def test_clean_allows_an_org_less_assigned_task_that_already_exists(self) -> None:
        # The shape an organization deletion leaves behind. It has to stay
        # editable, or the row can never be saved again.
        task = baker.make(Task, organization=None, assignee=self.member)

        task.clean()

    def test_clean_rejects_an_assignee_that_cannot_match_a_user(self) -> None:
        task = Task(organization=self.org, assignee_id="not-a-user-pk")

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("not-a-user-pk", ctx.exception.message_dict["assignee"][0])
