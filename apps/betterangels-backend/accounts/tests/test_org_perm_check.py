"""Unit tests for ``accounts.permissions.get_user_permitted_org``.

Regression coverage for the multi-valued-join bypass: the helper used to chain two
``.filter()`` calls over the multi-valued ``permission_groups`` relation, so the
membership condition and the permission condition could be satisfied by
*different* groups at the same org — "any member of any group holds every
permission any template in their org has".  Every org is provisioned with every
template, so that let a Caseworker pass a ``view_reports`` gate and download the
org's whole note history via ``/reports/export/``.

The utility is legacy-only and is now exercised against still-legacy groups
(ADR 0001 §5.3): the fixture member holds ``CASEWORKER`` (a legacy group), and
the permission-holding group is created by hand — the org no longer provisions
an ``Organization Admin``/``Organization Superuser`` group (role-backed).
"""

from accounts.models import PermissionGroup, User
from accounts.permissions import get_user_permitted_org
from accounts.role_manager import OrgRoleManager
from django.contrib.auth.models import Permission
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from reports.permissions import ReportPermissions

from .baker_recipes import organization_recipe


class GetUserPermittedOrgSingleJoinTestCase(TestCase):
    """Membership in one group must not satisfy a permission held by another."""

    def setUp(self) -> None:
        self.org = organization_recipe.make(name="Provisioned Org")
        self.caseworker = baker.make(User)
        self.org.add_user(self.caseworker)
        OrgRoleManager(self.org).add_roles(self.caseworker, CASEWORKER)

        # §5.3 provisioning retired the ORG_ADMIN/ORG_SUPERUSER PermissionGroups
        # (role-backed → Grants), so the "other group" that holds view_reports is
        # a hand-made legacy PermissionGroup.  ``reports.view_reports`` is a real
        # permission row on ScheduledReport (its declaring model).
        self.report_holder_group = PermissionGroup.objects.create(
            organization=self.org,
            label="Report Holders",
        )
        self.report_holder_group.permissions.add(
            Permission.objects.get(content_type__model="scheduledreport", codename="view_reports")
        )
        self.assertFalse(self.caseworker.groups.filter(pk=self.report_holder_group.pk).exists())

    def test_membership_in_another_group_does_not_confer_the_permission(self) -> None:
        org = get_user_permitted_org(
            self.caseworker,
            org_id=str(self.org.pk),
            permission=ReportPermissions.VIEW_REPORTS,
        )

        self.assertIsNone(org)

    def test_holding_the_permission_still_returns_the_org(self) -> None:
        self.caseworker.groups.add(self.report_holder_group)

        org = get_user_permitted_org(
            self.caseworker,
            org_id=str(self.org.pk),
            permission=ReportPermissions.VIEW_REPORTS,
        )

        if org is None:
            self.fail("expected the org to be returned for a holder of the permission")
        self.assertEqual(org.pk, self.org.pk)
