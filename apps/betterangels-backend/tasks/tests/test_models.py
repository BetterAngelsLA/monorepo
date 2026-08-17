from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from tasks.models import Task
from teams.models import Team


class TaskTeamOrgValidationTestCase(TestCase):
    """A task's team must belong to the task's organization.

    The service layer enforces this for GraphQL writes; ``clean()`` is what
    covers the Django admin, which offers an unfiltered team dropdown.
    """

    def setUp(self) -> None:
        self.org = organization_recipe.make(name="task_clean_org")
        self.other_org = organization_recipe.make(name="task_clean_other_org")
        self.own_team = baker.make(Team, organization=self.org, slug="own", name="Own")
        self.other_team = baker.make(Team, organization=self.other_org, slug="other", name="Other")

    def test_clean_allows_a_team_from_the_same_org(self) -> None:
        task = baker.make(Task, organization=self.org, team=self.own_team)

        task.clean()

    def test_clean_allows_no_team(self) -> None:
        task = baker.make(Task, organization=self.org, team=None)

        task.clean()

    def test_clean_rejects_a_team_from_another_org(self) -> None:
        # The database does not enforce this, so a cross-org row can exist.
        task = baker.make(Task, organization=self.org, team=self.other_team)

        with self.assertRaises(ValidationError) as ctx:
            task.clean()

        self.assertIn("team", ctx.exception.message_dict)

    def test_clean_skips_an_org_less_task(self) -> None:
        # ``organization`` is SET_NULL, so deleting an org leaves tasks with a
        # team but no org.  Editing those should not be blocked.
        task = baker.make(Task, organization=None, team=self.other_team)

        task.clean()
