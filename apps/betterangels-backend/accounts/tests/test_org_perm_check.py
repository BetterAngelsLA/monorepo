"""Unit tests for ``accounts.permissions.get_user_permitted_org``.

Regression coverage for the multi-valued-join bypass (audit finding, top of
``~/.claude/plans/can-you-do-a-eager-aurora.md``): the helper used to chain two
``.filter()`` calls over the multi-valued ``permission_groups`` relation, so the
membership condition and the permission condition could be satisfied by
*different* groups at the same org — "any member of any group holds every
permission any template in their org has".  Every org is provisioned with every
template, so that let a Caseworker pass a ``view_reports`` gate and download the
org's whole note history via ``/reports/export/``.
"""

from accounts.models import PermissionGroup, User
from accounts.permissions import get_user_permitted_org
from accounts.role_manager import OrgRoleManager
from django.test import TestCase
from model_bakery import baker
from notes.groups import CASEWORKER
from reports.permissions import ReportPermissions

from .baker_recipes import organization_recipe


class GetUserPermittedOrgSingleJoinTestCase(TestCase):
    """Membership in one group must not satisfy a permission held by another."""

    def setUp(self) -> None:
        # create_organization_with_presets provisions every template group the
        # org type offers — including ORG_ADMIN, which carries view_reports — so
        # the org has *both* a CASEWORKER group (for the user) and an ORG_ADMIN
        # group (holding view_reports) before the test asserts anything.
        self.org = organization_recipe.make(name="Provisioned Org")
        self.caseworker = baker.make(User)
        self.org.add_user(self.caseworker)
        OrgRoleManager(self.org).add_roles(self.caseworker, CASEWORKER)

        self.org_admin_group = PermissionGroup.objects.get(
            organization=self.org,
            template__name="Organization Admin",
        )
        self.assertFalse(self.caseworker.groups.filter(pk=self.org_admin_group.pk).exists())

    def test_membership_in_another_group_does_not_confer_the_permission(self) -> None:
        org = get_user_permitted_org(
            self.caseworker,
            org_id=str(self.org.pk),
            permission=ReportPermissions.VIEW_REPORTS,
        )

        self.assertIsNone(org)

    def test_holding_the_permission_still_returns_the_org(self) -> None:
        self.caseworker.groups.add(self.org_admin_group)

        org = get_user_permitted_org(
            self.caseworker,
            org_id=str(self.org.pk),
            permission=ReportPermissions.VIEW_REPORTS,
        )

        if org is None:
            self.fail("expected the org to be returned for a holder of the permission")
        self.assertEqual(org.pk, self.org.pk)
