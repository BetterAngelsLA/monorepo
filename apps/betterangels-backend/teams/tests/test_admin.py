"""The Django admin change form is the only place a user is offered a team's organization.

``UpdateTeamInput`` carries only ``name`` and ``is_active``, so GraphQL cannot
reach the field.  Other writers -- a service, a management command, a shell
session -- are stopped by the composite foreign key rather than by this form.
"""

from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from django import forms
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

    def _organization_field(self, obj: Team | None) -> forms.Field:
        form_class = self.team_admin.get_form(self.request, obj=obj)
        return form_class(instance=obj).fields["organization"]

    def test_organization_can_be_chosen_while_creating_a_team(self) -> None:
        self.assertFalse(self._organization_field(None).disabled)

    def test_organization_cannot_be_chosen_once_the_team_exists(self) -> None:
        self.assertTrue(self._organization_field(self.team).disabled)

    def test_the_change_form_cannot_move_a_team_to_another_organization(self) -> None:
        response = self.client.post(
            reverse("admin:teams_team_change", args=[self.team.pk]),
            {"name": self.team.name, "organization": str(self.other_organization.pk), "is_active": "on"},
        )

        self.assertEqual(response.status_code, 302)

        self.team.refresh_from_db()
        self.assertEqual(self.team.organization, self.organization)

    def test_the_change_form_still_reports_a_duplicate_name_as_an_error(self) -> None:
        """Fixing the organization must not stop the name constraint validating.

        A field excluded from the form is excluded from model validation, and
        ``UniqueConstraint.validate`` skips any constraint whose expressions
        reference an excluded field -- so dropping ``organization`` would take
        ``unique_team_name_per_org`` with it and the duplicate would reach
        Postgres as an unhandled IntegrityError.
        """
        taken = baker.make(Team, organization=self.organization, name="Outreach")

        response = self.client.post(
            reverse("admin:teams_team_change", args=[self.team.pk]),
            {"name": taken.name.lower(), "organization": str(self.organization.pk), "is_active": "on"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "A team with this name already exists in this organization.")

        self.team.refresh_from_db()
        self.assertNotEqual(self.team.name, taken.name.lower())
