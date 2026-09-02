"""Member-management authority — grant arm OR legacy (ADR 0001 §5.3, slice 3).

The four member-management permissions (``view_org_members``, ``add_org_member``,
``remove_org_member``, ``change_org_member_role``) ride the legacy
``ORG_ADMIN`` / ``ORG_SUPERUSER`` templates — no scoped ``Role`` rows exist, so
no holder has a ``Grant`` and the pure-Grant predicate returns nothing.  These
tests pin the **grant arm** of the transitional dual-read on both member queries
(``organizationMember`` / ``organizationMembers``) and all three mutations
(add / remove / change role): a scoped-Grant holder with no legacy group manages
members, and a Grant at org A does not authorize org B.

The legacy arm (a ``PermissionGroup`` holder) is pinned by the existing
``test_permissions.py`` suite; the transitional arms are deleted at the §5.3
provisioning PR, when the templates are role-backed and backfilled.
"""

from unittest.mock import patch

from accounts.groups import ORG_ADMIN
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from accounts.types import OrgTypeEnum, PermissionTemplateEnum
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from organizations.models import OrganizationUser
from shelters.groups import SHELTER_OPERATOR

from .baker_recipes import organization_recipe

MEMBER_PERMS = (
    "organizations.view_org_members",
    "organizations.add_org_member",
    "organizations.remove_org_member",
    "organizations.change_org_member_role",
)

VIEW_DENIED = "You do not have permission to view this organization's members."
ACTION_DENIED = "You do not have permission to perform this action in this organization."


class MemberManagementGrantAuthorityTestCase(GraphQLBaseTestCase):
    """A scoped-Grant holder (no PermissionGroup) manages members via the grant arm."""

    def setUp(self) -> None:
        super().setUp()

        self.grant_admin = baker.make(User, first_name="grant admin", email="grantadmin@example.com")
        self.org_1.add_user(self.grant_admin)
        for perm in MEMBER_PERMS:
            self._grant_permission(self.grant_admin, perm, self.org_1, role_name="Org Admin (grant)")

        self.removable_member = baker.make(User, first_name="removable", email="removable@example.com")
        self.org_1.add_user(self.removable_member)

        self.graphql_client.force_login(self.grant_admin)
        self._set_active_org(self.org_1)

    def test_grant_holder_can_view_a_member(self) -> None:
        query = """
            query ($organizationId: String!, $userId: String!) {
                organizationMember(organizationId: $organizationId, userId: $userId) {
                    id
                }
            }
        """
        variables = {
            "organizationId": str(self.org_1.pk),
            "userId": str(self.org_1_case_manager_1.pk),
        }

        response = self.execute_graphql(query, variables)

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["organizationMember"]["id"], str(self.org_1_case_manager_1.pk))

    def test_grant_holder_can_list_members(self) -> None:
        query = """
            query ($organizationId: String!) {
                organizationMembers(organizationId: $organizationId) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """
        variables = {"organizationId": str(self.org_1.pk)}

        response = self.execute_graphql(query, variables)

        self.assertIsNone(response.get("errors"))
        # Every member of org_1 is listed — the grant holder need not be an owner.
        self.assertEqual(response["data"]["organizationMembers"]["totalCount"], self.org_1.users.count())

    def test_grant_holder_can_add_a_member(self) -> None:
        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OrganizationMemberType {
                        email
                    }
                }
            }
        """
        variables = {
            "email": "new+grant@example.com",
            "firstName": "New",
            "lastName": "Grant",
            "organizationId": self.org_1.pk,
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }

        with patch("accounts.backends.CustomInvitations.send_invitation"):
            response = self.execute_graphql(mutation, {"data": variables})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "new+grant@example.com")

    def test_grant_holder_can_remove_a_member(self) -> None:
        mutation = """
            mutation ($data: RemoveOrganizationMemberInput!) {
                removeOrganizationMember(data: $data) {
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """
        variables = {
            "id": self.removable_member.pk,
            "organizationId": self.org_1.pk,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["removeOrganizationMember"]["id"], self.removable_member.pk)
        self.assertFalse(OrganizationUser.objects.filter(organization=self.org_1, user=self.removable_member).exists())

    def test_grant_holder_can_change_a_members_role(self) -> None:
        mutation = """
            mutation ($data: ChangeOrganizationMemberRoleInput!) {
                changeOrganizationMemberRole(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            message
                        }
                    }
                    ... on OrganizationMemberType {
                        id
                    }
                }
            }
        """
        variables = {
            "userId": self.org_1_case_manager_2.pk,
            "organizationId": self.org_1.pk,
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(
            response["data"]["changeOrganizationMemberRole"]["id"],
            str(self.org_1_case_manager_2.pk),
        )

    def test_grant_at_org_a_does_not_authorize_org_b(self) -> None:
        """A member-management Grant at org_1 does not authorize org_2."""
        query = """
            query ($organizationId: String!) {
                organizationMembers(organizationId: $organizationId) {
                    totalCount
                }
            }
        """
        response = self.execute_graphql(query, {"organizationId": str(self.org_2.pk)})
        self.assertIsNone(response["data"])
        self.assertEqual(response["errors"][0]["message"], VIEW_DENIED)

        self._set_active_org(self.org_2)
        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OrganizationMemberType {
                        email
                    }
                }
            }
        """
        variables = {
            "email": "wrong+org@example.com",
            "firstName": "Wrong",
            "lastName": "Org",
            "organizationId": self.org_2.pk,
            "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
        }
        response = self.execute_graphql(mutation, {"data": variables})
        self.assertIsNone(response["data"])
        self.assertEqual(response["errors"][0]["message"], ACTION_DENIED)


class MemberListGrantFilterTestCase(GraphQLBaseTestCase):
    """C-8: the member-list orgType/permissionTemplate filters union Grants.

    After teardown a role-backed Shelter Operator holds a Grant and no legacy
    ``PermissionGroup``; the operator-portal Users page (``orgType=SHELTER``)
    must still list them.  The filters used to read ``PermissionGroup`` only, so
    grant-held operators vanished from the page while the display annotation
    beside them read both authorities.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.shelter_org = organization_recipe.make(preset_names=["shelter"], owner_roles=(SHELTER_OPERATOR,))
        # A legacy ORG_ADMIN viewer at the shelter org runs the query.
        self.viewer = baker.make(User, first_name="shelter admin")
        self.shelter_org.add_user(self.viewer)
        OrgRoleManager(self.shelter_org).add_roles(self.viewer, ORG_ADMIN)
        # A role-backed Shelter Operator: Grant only, no legacy PermissionGroup.
        self.operator = baker.make(User, first_name="shelter operator")
        self.shelter_org.add_user(self.operator)
        OrgRoleManager(self.shelter_org).add_roles(self.operator, SHELTER_OPERATOR)
        self.assertFalse(PermissionGroup.objects.filter(organization=self.shelter_org, user=self.operator).exists())

        self.graphql_client.force_login(self.viewer)
        self._set_active_org(self.shelter_org)

    def _list_org_members(
        self,
        *,
        org_type: str | None = None,
        permission_template: str | None = None,
    ) -> dict:
        query = """
            query ($organizationId: String!, $orgType: OrgTypeEnum, $permissionTemplate: PermissionTemplateEnum) {
                organizationMembers(organizationId: $organizationId, orgType: $orgType, permissionTemplate: $permissionTemplate) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """
        variables = {"organizationId": str(self.shelter_org.pk)}
        if org_type is not None:
            variables["orgType"] = org_type
        if permission_template is not None:
            variables["permissionTemplate"] = permission_template
        return self.execute_graphql(query, variables)

    def _member_ids(self, response: dict) -> set[str]:
        self.assertIsNone(response.get("errors"))
        return {m["id"] for m in response["data"]["organizationMembers"]["results"]}

    def test_grant_held_operator_survives_the_org_type_filter(self) -> None:
        response = self._list_org_members(org_type=OrgTypeEnum.SHELTER.name)

        member_ids = self._member_ids(response)
        self.assertIn(str(self.operator.pk), member_ids)

    def test_grant_held_operator_survives_the_permission_template_filter(self) -> None:
        response = self._list_org_members(permission_template=PermissionTemplateEnum.SHELTER_OPERATOR.name)

        member_ids = self._member_ids(response)
        self.assertIn(str(self.operator.pk), member_ids)

    def test_member_without_the_role_still_fails_the_filter(self) -> None:
        plain_member = baker.make(User, first_name="plain member")
        self.shelter_org.add_user(plain_member)

        response = self._list_org_members(permission_template=PermissionTemplateEnum.SHELTER_OPERATOR.name)

        member_ids = self._member_ids(response)
        self.assertNotIn(str(plain_member.pk), member_ids)
        self.assertIn(str(self.operator.pk), member_ids)
