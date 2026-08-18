"""The post_migrate permission sync.

Every deploy runs migrations, so this handler is what keeps each
organization's Django Groups carrying the permissions their template
defines.  There is no management command to run it by hand — that would be
the same code path, so it could only fail the same way.  These tests cover
the handler itself, including that a real failure is *not* swallowed.
"""

from unittest.mock import patch

from accounts.models import PermissionGroup
from accounts.signals import sync_all_org_permission_groups
from accounts.tests.baker_recipes import organization_recipe
from django.contrib.auth.models import Permission
from django.db import ProgrammingError
from django.test import TestCase


class SyncAllOrgPermissionGroupsTestCase(TestCase):
    def setUp(self) -> None:
        self.org = organization_recipe.make(name="sync_signal_org")

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

    def _drift(self) -> None:
        """Take a permission away so the group no longer matches its template."""
        self.permission_group.group.permissions.remove(self.template_permission)

    def test_restores_a_permission_removed_from_a_group(self) -> None:
        self._drift()

        sync_all_org_permission_groups(None)

        self.assertIn(self.template_permission, self.permission_group.group.permissions.all())

    def test_strips_a_permission_the_template_does_not_grant(self) -> None:
        own_template = self.permission_group.template
        assert own_template is not None
        surplus = Permission.objects.exclude(pk__in=own_template.permissions.values("pk")).first()
        assert surplus is not None, "expected at least one permission outside the template"
        self.permission_group.group.permissions.add(surplus)

        sync_all_org_permission_groups(None)

        self.assertNotIn(surplus, self.permission_group.group.permissions.all())

    def test_leaves_a_matching_group_matching(self) -> None:
        """Compared by codename, not pk.

        The sync reassigns permissions rather than topping them up, so the
        rows a group points at can change identity while the effective set
        does not.
        """
        before = set(self.permission_group.group.permissions.values_list("codename", flat=True))

        sync_all_org_permission_groups(None)

        after = set(self.permission_group.group.permissions.values_list("codename", flat=True))
        self.assertEqual(before, after)

    def test_is_idempotent(self) -> None:
        self._drift()
        sync_all_org_permission_groups(None)
        first = set(self.permission_group.group.permissions.values_list("codename", flat=True))

        sync_all_org_permission_groups(None)

        self.assertEqual(first, set(self.permission_group.group.permissions.values_list("codename", flat=True)))


class SyncFailureHandlingTestCase(TestCase):
    """A failed sync must not look like a successful one.

    This previously caught ``Exception`` and returned, which also skipped the
    template-permission sync — so a deploy could leave every organization on
    stale permissions and still report success.
    """

    def test_an_unexpected_error_propagates(self) -> None:
        with patch("accounts.services.reconcile_org_groups", side_effect=ValueError("boom")):
            with self.assertRaises(ValueError):
                sync_all_org_permission_groups(None)

    def test_an_incomplete_schema_is_tolerated_and_logged(self) -> None:
        """A targeted ``migrate <app>`` can fire this before every table exists."""
        with patch("accounts.services.reconcile_org_groups", side_effect=ProgrammingError("no such table")):
            with self.assertLogs("accounts.signals", level="WARNING") as logs:
                sync_all_org_permission_groups(None)

        self.assertTrue(any("schema is incomplete" in line for line in logs.output))
