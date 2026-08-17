"""Tests for the org permission-group sync command."""

from io import StringIO

from accounts.models import PermissionGroup
from django.contrib.auth.models import Permission
from accounts.tests.baker_recipes import organization_recipe
from django.core.management import call_command
from django.test import TestCase


class SyncOrgPermissionGroupsTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(name="sync_cmd_org")

        permission_group = (
            PermissionGroup.objects.select_related("template", "group")
            .filter(organization=self.org, template__isnull=False)
            .first()
        )
        assert permission_group is not None, "the org recipe should provision templated permission groups"
        self.permission_group = permission_group

        assert self.permission_group.template is not None
        template_permission = self.permission_group.template.permissions.first()
        assert template_permission is not None, "the template should carry permissions"
        self.template_permission = template_permission

    def _run(self, *args: str) -> str:
        out = StringIO()
        call_command("sync_org_permission_groups", *args, stdout=out)
        return out.getvalue()

    def _drift(self) -> None:
        """Take a permission away from the group so it no longer matches its template."""
        self.permission_group.group.permissions.remove(self.template_permission)

    # -- --check ------------------------------------------------------------

    def test_check_reports_nothing_when_groups_match_their_templates(self) -> None:
        output = self._run("--check")

        self.assertIn("0 permission group(s) out of sync.", output)
        self.assertNotIn("MISMATCH", output)

    def test_check_reports_a_group_missing_a_template_permission(self) -> None:
        self._drift()

        output = self._run("--check")

        self.assertIn("MISMATCH", output)
        self.assertIn(f"org={self.org.pk}", output)
        self.assertNotIn("0 permission group(s) out of sync.", output)

    def test_check_reports_a_group_holding_an_extra_permission(self) -> None:
        own_template = self.permission_group.template
        assert own_template is not None
        # Any permission the template does not carry — not borrowed from another
        # template, which may hold the same set.
        surplus = Permission.objects.exclude(pk__in=own_template.permissions.values("pk")).first()
        assert surplus is not None, "expected at least one permission outside the template"

        self.permission_group.group.permissions.add(surplus)

        output = self._run("--check")

        self.assertIn("MISMATCH", output)

    def test_check_does_not_repair_the_drift(self) -> None:
        self._drift()

        self._run("--check")

        self.assertNotIn(
            self.template_permission,
            self.permission_group.group.permissions.all(),
        )

    # -- write mode ---------------------------------------------------------

    def test_sync_restores_a_missing_permission(self) -> None:
        self._drift()

        output = self._run()

        self.assertIn("Synced all organization permission groups.", output)
        self.assertIn(
            self.template_permission,
            self.permission_group.group.permissions.all(),
        )

    def test_sync_keeps_a_matching_group_matching(self) -> None:
        """Compared by codename, not pk.

        The sync reassigns permissions rather than topping them up, so the rows
        a group points at can change identity while the effective set does not.
        """
        before = set(self.permission_group.group.permissions.values_list("codename", flat=True))

        self._run()

        after = set(self.permission_group.group.permissions.values_list("codename", flat=True))
        self.assertEqual(before, after)

    def test_check_is_clean_again_after_a_sync(self) -> None:
        self._drift()
        self._run()

        output = self._run("--check")

        self.assertIn("0 permission group(s) out of sync.", output)
