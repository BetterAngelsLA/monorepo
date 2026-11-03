"""Tests for ``manage.py audit_stale_grants`` (the forward-only gap in #2456)."""

import json
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker

from accounts.groups import ORG_ADMIN
from accounts.models import Grant, OrganizationProfile, PermissionGroup, Role, User
from accounts.tests.baker_recipes import organization_recipe
from notes.groups import CASEWORKER


class AuditStaleGrantsTests(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        self.group = PermissionGroup.objects.get(organization=self.org, template__name=CASEWORKER.name)
        self.role = Role.objects.get(name=CASEWORKER.name, is_global=False)
        self.member = baker.make(User, email="member@example.com")
        self.org.add_user(self.member)
        self.member.groups.add(self.group)

    def _run(self, *args: str) -> str:
        out = StringIO()
        call_command("audit_stale_grants", *args, stdout=out)
        return out.getvalue()

    def _drop_outreach(self) -> None:
        OrganizationProfile.objects.filter(organization=self.org).update(org_types=["shelter"])

    def test_reports_nothing_when_the_config_matches(self) -> None:
        self.assertEqual(self._run().strip(), "No stale grants found.")

    def test_reports_an_orphaned_grant(self) -> None:
        """The row is gone, so reconcile can never see this grant again."""
        PermissionGroup.objects.filter(pk=self.group.pk).delete()
        self._drop_outreach()

        output = self._run()

        self.assertIn(f"user {self.member.pk}", output)
        self.assertNotIn("member@example.com", output)
        self.assertIn(CASEWORKER.name, output)
        self.assertIn("orphaned", output)
        self.assertIn("1 orphaned", output)

    def test_a_still_existing_row_is_reported_as_pending_reconcile(self) -> None:
        self._drop_outreach()

        output = self._run()

        self.assertIn("pending-reconcile", output)
        self.assertIn("0 orphaned", output)
        self.assertTrue(Grant.objects.filter(principal_user=self.member, role=self.role, scope_org=self.org).exists())

    def test_json_and_org_filter(self) -> None:
        PermissionGroup.objects.filter(pk=self.group.pk).delete()
        self._drop_outreach()

        payload = json.loads(self._run("--org", str(self.org.pk), "--json"))

        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]["status"], "orphaned")
        self.assertEqual(payload[0]["role"], CASEWORKER.name)
        self.assertEqual(payload[0]["organization_id"], self.org.pk)
        self.assertEqual(payload[0]["user_id"], self.member.pk)
        self.assertNotIn("user", payload[0])

    def test_scoping_to_another_org_reports_nothing(self) -> None:
        PermissionGroup.objects.filter(pk=self.group.pk).delete()
        self._drop_outreach()
        other = organization_recipe.make(preset_names=["shelter"], owner_roles=())

        self.assertEqual(self._run("--org", str(other.pk)).strip(), "No stale grants found.")

    def test_grant_only_roles_are_not_reported(self) -> None:
        """ORG_ADMIN is never in the expected set; it is not a stale mirror."""
        org_admin_role = Role.objects.get(name=ORG_ADMIN.name, is_global=False)
        Grant.objects.create(principal_user=self.member, role=org_admin_role, scope_org=self.org)

        self.assertEqual(self._run().strip(), "No stale grants found.")
