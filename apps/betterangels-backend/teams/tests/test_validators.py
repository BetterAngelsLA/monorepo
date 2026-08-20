from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ValidationError
from django.test import TestCase
from model_bakery import baker
from teams.models import Team
from teams.validators import validate_team_in_org


class ValidateTeamInOrgTestCase(TestCase):
    def setUp(self) -> None:
        self.org_1 = organization_recipe.make()
        self.org_2 = organization_recipe.make()
        self.org_1_team = baker.make(Team, organization=self.org_1)
        self.org_2_team = baker.make(Team, organization=self.org_2)

    def test_team_in_org_passes(self) -> None:
        validate_team_in_org(team_id=self.org_1_team.pk, organization_id=self.org_1.pk)

    def test_team_from_other_org_raises(self) -> None:
        with self.assertRaises(ValidationError):
            validate_team_in_org(team_id=self.org_2_team.pk, organization_id=self.org_1.pk)

    def test_unknown_team_raises(self) -> None:
        with self.assertRaises(ValidationError):
            validate_team_in_org(team_id=999_999, organization_id=self.org_1.pk)

    def test_no_team_passes(self) -> None:
        validate_team_in_org(team_id=None, organization_id=self.org_1.pk)

    def test_no_organization_raises_when_a_team_is_requested(self) -> None:
        with self.assertRaises(ValidationError):
            validate_team_in_org(team_id=self.org_1_team.pk, organization_id=None)

    def test_no_organization_passes_without_a_team(self) -> None:
        validate_team_in_org(team_id=None, organization_id=None)
