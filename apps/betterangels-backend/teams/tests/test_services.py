"""Tests for team services."""

from django.core.exceptions import ValidationError
from django.test import TestCase
from organizations.models import Organization
from teams.models import Team
from teams.services import resolve_team_id_for_org


class ResolveTeamIdForOrgTestCase(TestCase):
    """Org-scoped team resolution — cross-org ids must be rejected."""

    def setUp(self) -> None:
        self.org_1 = Organization.objects.create(name="resolve_org_1")
        self.org_2 = Organization.objects.create(name="resolve_org_2")
        self.org_1_team = Team.objects.create(slug="wdi_on_site", name="WDI On-site", organization=self.org_1)
        self.org_2_team = Team.objects.create(slug="wdi_on_site", name="WDI On-site", organization=self.org_2)

    def test_team_id_belongs_to_org(self) -> None:
        self.assertEqual(
            resolve_team_id_for_org(team_id=self.org_1_team.pk, organization_id=self.org_1.pk),
            self.org_1_team.pk,
        )

    def test_team_id_from_other_org_raises(self) -> None:
        with self.assertRaises(ValidationError):
            resolve_team_id_for_org(team_id=self.org_2_team.pk, organization_id=self.org_1.pk)

    def test_team_id_missing_raises(self) -> None:
        with self.assertRaises(ValidationError):
            resolve_team_id_for_org(team_id=999_999, organization_id=self.org_1.pk)

    def test_no_team_id_returns_none(self) -> None:
        self.assertIsNone(resolve_team_id_for_org(team_id=None, organization_id=self.org_1.pk))
