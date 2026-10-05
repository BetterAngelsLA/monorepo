"""Role-reporting selectors — the Django admin's "what does this person hold, and where".

Post-teardown (ADR 0001) a role reaches the report through one of two arms: the
dual-write ``PermissionGroup`` membership, or the grant-only scoped ``Role``
``Grant`` (ORG_ADMIN/ORG_SUPERUSER, whose legacy rows are retired).  The
selectors merge the two, so the arms must not double-report a dual-write role.
"""

from typing import TYPE_CHECKING

from accounts.groups import ORG_ADMIN
from accounts.selectors import role_names_by_organization
from accounts.services import member_add
from common.permissions.config import TemplateConfig
from django.test import TestCase
from notes.groups import CASEWORKER
from organizations.models import Organization
from shelters.groups import SHELTER_OPERATOR

from .baker_recipes import organization_recipe

if TYPE_CHECKING:
    from accounts.models import User


class RoleNamesByOrganizationTestCase(TestCase):
    def _add(self, email: str, organization: Organization, *templates: TemplateConfig) -> User:
        return member_add(
            email=email,
            first_name="",
            last_name="",
            middle_name=None,
            organization=organization,
            permission_templates=templates,
        )

    def test_a_dual_write_role_is_named_once(self) -> None:
        """CASEWORKER has a membership *and* its mirrored Grant — one name, not two."""
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        member = self._add("dual@example.com", organization, CASEWORKER)

        self.assertEqual(
            role_names_by_organization(user_id=member.pk),
            {organization.name: [CASEWORKER.name]},
        )

    def test_a_grant_only_role_joins_the_dual_write_ones(self) -> None:
        organization = organization_recipe.make(preset_names=["outreach"], owner_roles=())
        member = self._add("grantadmin@example.com", organization, CASEWORKER, ORG_ADMIN)

        self.assertEqual(
            role_names_by_organization(user_id=member.pk),
            {organization.name: [CASEWORKER.name, ORG_ADMIN.name]},
        )

    def test_roles_are_grouped_by_organization(self) -> None:
        outreach = organization_recipe.make(name="Outreach Org", preset_names=["outreach"], owner_roles=())
        shelter = organization_recipe.make(name="Shelter Org", preset_names=["shelter"], owner_roles=())
        member = self._add("both@example.com", outreach, CASEWORKER)
        self._add("both@example.com", shelter, SHELTER_OPERATOR)

        self.assertEqual(
            role_names_by_organization(user_id=member.pk),
            {outreach.name: [CASEWORKER.name], shelter.name: [SHELTER_OPERATOR.name]},
        )
