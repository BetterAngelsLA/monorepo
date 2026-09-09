"""Member-management authority — grant-only (ADR 0001 §5.3, member-management cutover).

The org-root ``organizations.*`` codenames authorize through ``require_can``
(``can()``): role-backed ORG_ADMIN / ORG_SUPERUSER with backfilled Grants, a
scoped direct Grant, or the global tier (superuser).  The member reads and the
add/remove/change-role mutations take the org from the payload
(``organizationId``); the ``X-Organization-ID`` header is never read.  Legacy
``PermissionGroup`` rows alone no longer authorize anything.

These tests pin the flipped contract:

- a role-backed ORG_ADMIN views / adds / removes members, and an ORG_SUPERUSER
  additionally changes roles;
- a legacy-only ORG_ADMIN (PermissionGroup membership, no Grant) is DENIED —
  the flip that made the cutover grant-only;
- a direct-grant holder with no legacy group is authorized;
- a member with neither authority is denied;
- a Grant at org A does not authorize org B;
- the global tier (superuser) is enforceable at any org;
- the org header is inert: the payload org authorizes even with a stale/absent
  header.
"""

from typing import Any

from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import PermissionGroup, User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from accounts.types import PermissionTemplateEnum
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Group
from model_bakery import baker
from notes.groups import CASEWORKER

PERMISSION_DENIED = "You do not have permission to perform this action in this organization."

VIEW_MEMBER_QUERY = """
    query ($organizationId: String!, $userId: String!) {
        organizationMember(organizationId: $organizationId, userId: $userId) {
            id
            email
        }
    }
"""

VIEW_MEMBERS_QUERY = """
    query ($organizationId: String!) {
        organizationMembers(organizationId: $organizationId) {
            totalCount
            results {
                id
                email
            }
        }
    }
"""

ADD_MEMBER_MUTATION = """
    mutation ($data: OrgInvitationInput!) {
        addOrganizationMember(data: $data) {
            ... on OperationInfo {
                messages {
                    kind
                    message
                }
            }
            ... on OrganizationMemberType {
                id
                email
            }
        }
    }
"""

REMOVE_MEMBER_MUTATION = """
    mutation ($data: RemoveOrganizationMemberInput!) {
        removeOrganizationMember(data: $data) {
            ... on OperationInfo {
                messages {
                    kind
                    message
                }
            }
            ... on DeletedObjectType {
                id
            }
        }
    }
"""

CHANGE_ROLE_MUTATION = """
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


class MemberManagementGraphQLMixin:
    """Per-operation GraphQL helpers (all payload-org; header left on org_1).

    Each call force_logins *user*, so a test can flip actors freely.
    """

    def _view_member(self, user: User, org: object, member: User) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(
            VIEW_MEMBER_QUERY,
            {"organizationId": str(org.pk), "userId": str(member.pk)},
        )

    def _view_members(self, user: User, org: object) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(VIEW_MEMBERS_QUERY, {"organizationId": str(org.pk)})

    def _add_member(self, user: User, org: object, *, email: str) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(
            ADD_MEMBER_MUTATION,
            {
                "data": {
                    "email": email,
                    "firstName": "New",
                    "lastName": "Member",
                    "organizationId": org.pk,
                    "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
                }
            },
        )

    def _remove_member(self, user: User, org: object, member: User) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(
            REMOVE_MEMBER_MUTATION,
            {"data": {"id": member.pk, "organizationId": org.pk}},
        )

    def _change_role(self, user: User, org: object, member: User) -> dict[str, Any]:
        self.graphql_client.force_login(user)
        return self.execute_graphql(
            CHANGE_ROLE_MUTATION,
            {
                "data": {
                    "userId": member.pk,
                    "organizationId": org.pk,
                    "permissionTemplate": PermissionTemplateEnum.CASEWORKER.name,
                }
            },
        )


class MemberManagementGrantAuthorityTestCase(MemberManagementGraphQLMixin, GraphQLBaseTestCase):
    """Grant holders manage members after the grant-only cutover."""

    def setUp(self) -> None:
        super().setUp()
        # Provision the code-owned Role rows so OrgRoleManager mirrors Grants.
        sync_roles()

    # ── authority present ─────────────────────────────────────────────────────

    def test_role_backed_org_admin_views_adds_and_removes_members(self) -> None:
        admin = baker.make(User, email="grant-admin@example.com")
        removable = baker.make(User, email="removable@example.com")
        self.org_1.add_user(admin)
        self.org_1.add_user(removable)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)
        # Sanity: the mirrored Grant — nothing else — authorizes.
        self.assertTrue(admin.grants.filter(scope_org=self.org_1, role__name=ORG_ADMIN.name).exists())

        # view (single + list)
        response = self._view_member(admin, self.org_1, self.org_1_case_manager_1)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["organizationMember"]["id"], str(self.org_1_case_manager_1.pk))
        response = self._view_members(admin, self.org_1)
        self.assertIsNone(response.get("errors"))
        ids = {r["id"] for r in response["data"]["organizationMembers"]["results"]}
        self.assertIn(str(admin.pk), ids)

        # add
        response = self._add_member(admin, self.org_1, email="invited@example.com")
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "invited@example.com")
        added = User.objects.get(email="invited@example.com")
        self.assertTrue(self.org_1.users.filter(pk=added.pk).exists())

        # remove (not the owner — this org has none)
        response = self._remove_member(admin, self.org_1, removable)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(self.org_1.users.filter(pk=removable.pk).exists())

    def test_role_backed_org_superuser_changes_member_roles(self) -> None:
        """CHANGE_ORG_MEMBER_ROLE sits on ORG_SUPERUSER only."""
        superuser = baker.make(User, email="super@example.com")
        member = baker.make(User, email="member@example.com")
        self.org_1.add_user(superuser)
        self.org_1.add_user(member)
        OrgRoleManager(self.org_1).add_roles(superuser, ORG_SUPERUSER)

        response = self._change_role(superuser, self.org_1, member)
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["changeOrganizationMemberRole"]["id"], str(member.pk))
        # Dual-write: the invitation role is mirrored as a PermissionGroup.
        group = Group.objects.get(
            permissiongroup__organization=self.org_1,
            permissiongroup__template__name=CASEWORKER.name,
        )
        self.assertIn(group, member.groups.all())

    def test_org_admin_cannot_change_member_roles(self) -> None:
        """ORG_ADMIN bundles member mgmt except CHANGE_ORG_MEMBER_ROLE."""
        admin = baker.make(User, email="grant-admin@example.com")
        member = baker.make(User, email="member@example.com")
        self.org_1.add_user(admin)
        self.org_1.add_user(member)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        response = self._change_role(admin, self.org_1, member)
        self.assertGraphQLOperationInfo(response, "changeOrganizationMemberRole", PERMISSION_DENIED, kind="PERMISSION")

    def test_scoped_grant_holder_with_no_legacy_group_can_manage_members(self) -> None:
        """A scoped Grant alone authorizes — no legacy PermissionGroup needed."""
        grant_user = baker.make(User, email="direct@example.com")
        removable = baker.make(User, email="removable@example.com")
        self.org_1.add_user(grant_user)
        self.org_1.add_user(removable)
        for perm in (
            "organizations.view_org_members",
            "organizations.add_org_member",
            "organizations.remove_org_member",
        ):
            self._grant_permission(grant_user, perm, self.org_1, role_name="Member Manager")
        self.assertFalse(PermissionGroup.objects.filter(organization=self.org_1, user=grant_user).exists())

        response = self._view_members(grant_user, self.org_1)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["organizationMembers"]["totalCount"])

        response = self._add_member(grant_user, self.org_1, email="invited2@example.com")
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "invited2@example.com")

        response = self._remove_member(grant_user, self.org_1, removable)
        self.assertIsNone(response.get("errors"))
        self.assertFalse(self.org_1.users.filter(pk=removable.pk).exists())

    def test_superuser_can_manage_members_at_an_org(self) -> None:
        """The global tier is enforceable per org for the grant-only domain."""
        user = baker.make(User, is_superuser=True)
        self.org_1.add_user(user)

        response = self._view_members(user, self.org_1)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["organizationMembers"]["totalCount"])

        response = self._add_member(user, self.org_1, email="super-invited@example.com")
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "super-invited@example.com")

    def test_reads_and_writes_ignore_the_org_header(self) -> None:
        """No header at all — the payload org authorizes.

        The base fixture leaves ``X-Organization-ID`` on ``org_1``; acting on
        ``org_2`` below doubles as a stale-header check.
        """
        admin = baker.make(User, email="org2-admin@example.com")
        self.org_2.add_user(admin)
        OrgRoleManager(self.org_2).add_roles(admin, ORG_ADMIN)
        self.graphql_client.defaults.pop("HTTP_X_ORGANIZATION_ID", None)

        response = self._view_members(admin, self.org_2)
        self.assertIsNone(response.get("errors"))
        self.assertIsNotNone(response["data"]["organizationMembers"]["totalCount"])

        response = self._add_member(admin, self.org_2, email="org2-invited@example.com")
        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["addOrganizationMember"]["email"], "org2-invited@example.com")


class MemberManagementGrantAuthorityDeniedTestCase(MemberManagementGraphQLMixin, GraphQLBaseTestCase):
    """Authority absent: legacy-only holders, partial holders, members, cross-org."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_legacy_only_org_admin_is_denied(self) -> None:
        """A legacy PermissionGroup ORG_ADMIN with no Grant no longer manages members."""
        legacy_admin = baker.make(User, email="legacy-admin@example.com")
        removable = baker.make(User, email="removable@example.com")
        self.org_1.add_user(legacy_admin)
        self.org_1.add_user(removable)
        group = PermissionGroup.objects.get(organization=self.org_1, template__name=ORG_ADMIN.name)
        group.user_set.add(legacy_admin)
        self.assertFalse(legacy_admin.grants.filter(scope_org=self.org_1).exists())

        response = self._view_members(legacy_admin, self.org_1)
        self.assertGraphQLError(response, PERMISSION_DENIED, exact=True)

        response = self._add_member(legacy_admin, self.org_1, email="should-not@example.com")
        self.assertGraphQLOperationInfo(response, "addOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")
        self.assertFalse(User.objects.filter(email="should-not@example.com").exists())

        response = self._remove_member(legacy_admin, self.org_1, removable)
        self.assertGraphQLOperationInfo(response, "removeOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")
        self.assertTrue(self.org_1.users.filter(pk=removable.pk).exists())

    def test_grant_holder_with_only_view_cannot_add_or_remove(self) -> None:
        """Mutations thread the exact permission — ADD/REMOVE, not just VIEW."""
        view_only = baker.make(User, email="viewer@example.com")
        removable = baker.make(User, email="removable@example.com")
        self.org_1.add_user(view_only)
        self.org_1.add_user(removable)
        self._grant_permission(view_only, "organizations.view_org_members", self.org_1, role_name="Member Viewer")

        response = self._view_members(view_only, self.org_1)
        self.assertIsNone(response.get("errors"))

        response = self._add_member(view_only, self.org_1, email="should-not@example.com")
        self.assertGraphQLOperationInfo(response, "addOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")

        response = self._remove_member(view_only, self.org_1, removable)
        self.assertGraphQLOperationInfo(response, "removeOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")

    def test_member_with_no_authority_is_denied(self) -> None:
        member = baker.make(User, email="member@example.com")
        self.org_1.add_user(member)

        response = self._view_members(member, self.org_1)
        self.assertGraphQLError(response, PERMISSION_DENIED, exact=True)

        response = self._add_member(member, self.org_1, email="should-not@example.com")
        self.assertGraphQLOperationInfo(response, "addOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")

    def test_grant_at_org_a_does_not_authorize_org_b(self) -> None:
        """A role-backed ORG_ADMIN holds org_1 only; acting at org_2 must fail."""
        admin = baker.make(User, email="grant-admin@example.com")
        removable = baker.make(User, email="removable@example.com")
        self.org_1.add_user(admin)
        self.org_2.add_user(admin)
        self.org_2.add_user(removable)
        OrgRoleManager(self.org_1).add_roles(admin, ORG_ADMIN)

        response = self._view_members(admin, self.org_2)
        self.assertGraphQLError(response, PERMISSION_DENIED, exact=True)

        response = self._remove_member(admin, self.org_2, removable)
        self.assertGraphQLOperationInfo(response, "removeOrganizationMember", PERMISSION_DENIED, kind="PERMISSION")
        self.assertTrue(self.org_2.users.filter(pk=removable.pk).exists())
