"""The Django admin is the only surface that can repoint a team's organization.

``UpdateTeamInput`` carries only ``name`` and ``is_active``, so GraphQL cannot
reach the field at all.
"""

from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from django.contrib import admin
from django.test import RequestFactory, TestCase
from django.urls import reverse
from model_bakery import baker
from teams.admin import TeamAdmin
from teams.models import Team


class TeamAdminOrganizationTestCase(TestCase):
    def setUp(self) -> None:
        self.superuser = User.objects.create_superuser(
            username="team_admin_tests", email="team_admin_tests@example.com", password="password"
        )
        self.client.force_login(self.superuser)

        self.organization = organization_recipe.make()
        self.other_organization = organization_recipe.make()
        self.team = baker.make(Team, organization=self.organization)

        self.team_admin = TeamAdmin(Team, admin.site)
        self.request = RequestFactory().get("/")
        self.request.user = self.superuser

    def test_organization_can_be_chosen_while_creating_a_team(self) -> None:
        self.assertNotIn("organization", self.team_admin.get_readonly_fields(self.request, obj=None))

    def test_organization_is_read_only_once_the_team_exists(self) -> None:
        self.assertIn("organization", self.team_admin.get_readonly_fields(self.request, obj=self.team))

    def test_the_change_form_cannot_move_a_team_to_another_organization(self) -> None:
        response = self.client.post(
            reverse("admin:teams_team_change", args=[self.team.pk]),
            {"name": self.team.name, "organization": str(self.other_organization.pk), "is_active": "on"},
        )

        self.assertEqual(response.status_code, 302)

        self.team.refresh_from_db()
        self.assertEqual(self.team.organization, self.organization)
