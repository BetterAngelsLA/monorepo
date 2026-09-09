from typing import Optional

from accounts.models import User
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from organizations.models import OrganizationUser
from unittest_parametrize import ParametrizedTestCase, parametrize

from .baker_recipes import organization_recipe


class OrganizationMemberPermissionTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_member = baker.make(User, first_name="org member")
        self.org_1_admin = baker.make(User, first_name="org 1 admin")
        self.org_2_admin = baker.make(User, first_name="org 2 admin")

        self.org_1 = organization_recipe.make(name="org 1", owner=self.org_1_admin)
        self.org_2 = organization_recipe.make(name="org 2", owner=self.org_2_admin)

        self.org_1.add_user(self.org_member)
        self.org_2.add_user(self.org_member)
        self._set_active_org(self.org_1)

    @parametrize(
        "user, expected_error",
        [
            # Member mgmt is grant-only (ADR 0001 §5.3): a plain member and a
            # cross-org admin are both denied by require_can at the payload org.
            ("org_member", "You do not have permission to perform this action in this organization."),
            ("org_1_admin", None),
            ("org_2_admin", "You do not have permission to perform this action in this organization."),
        ],
    )
    def test_view_organization_member_permission(self, user: str, expected_error: Optional[str]) -> None:
        self.graphql_client.force_login(getattr(self, f"{user}"))
        query = """
            query ($organizationId: String!, $userId: String!) {
                organizationMember(organizationId: $organizationId, userId: $userId) {
                    id
                }
            }
        """

        variables = {
            "organizationId": str(self.org_1.pk),
            "userId": str(self.org_member.pk),
        }

        response = self.execute_graphql(query, variables)
        if expected_error:
            self.assertIsNone(response["data"])
            self.assertEqual(len(response["errors"]), 1)
            self.assertEqual(
                expected_error,
                response["errors"][0]["message"],
            )
        else:
            self.assertEqual(response["data"]["organizationMember"]["id"], str(self.org_member.pk))

    @parametrize(
        "user, org, expected_member_count, expected_members",
        [
            # Grant-only (ADR 0001 §5.3): a plain member is DENIED the member
            # list (require_can at the payload org), like any non-grant holder.
            ("org_member", "org_1", None, []),
            ("org_1_admin", "org_1", 2, ["org member", "org 1 admin"]),
            ("org_1_admin", "org_2", None, []),
            ("org_2_admin", "org_1", None, []),
            ("org_2_admin", "org_2", 2, ["org member", "org 2 admin"]),
        ],
    )
    def test_view_organization_members_permission(
        self,
        user: str,
        org: str,
        expected_member_count: Optional[int],
        expected_members: list[str],
    ) -> None:
        self.graphql_client.force_login(getattr(self, f"{user}"))
        self._set_active_org(getattr(self, org))

        query = """
            query ($organizationId: String!) {
                organizationMembers(organizationId: $organizationId) {
                    totalCount
                    results {
                        id
                        firstName
                        lastName
                        lastLogin
                    }
                }
            }
        """

        member_id = getattr(self, f"{user}").pk
        org_id = getattr(self, f"{org}").pk
        variables = {"organizationId": str(org_id), "userId": str(member_id)}

        response = self.execute_graphql(query, variables)

        if expected_member_count is not None:
            self.assertEqual(response["data"]["organizationMembers"]["totalCount"], expected_member_count)

            member_names = [m["firstName"] for m in response["data"]["organizationMembers"]["results"]]
            self.assertCountEqual(member_names, expected_members)

        else:
            self.assertIsNone(response["data"])
            self.assertEqual(len(response["errors"]), 1)
            self.assertEqual(
                response["errors"][0]["message"],
                "You do not have permission to perform this action in this organization.",
            )


class AddOrganizationMemberPermissionTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_member = baker.make(User, first_name="org member")
        self.org_1_admin = baker.make(User, first_name="org 1 admin")
        self.org_2_admin = baker.make(User, first_name="org 2 admin")

        self.org_1 = organization_recipe.make(name="org 1", owner=self.org_1_admin)
        self.org_2 = organization_recipe.make(name="org 2", owner=self.org_2_admin)

        self.org_1.add_user(self.org_member)
        self._set_active_org(self.org_1)

    @parametrize(
        "user, expected_error",
        [
            ("org_member", "You do not have permission to perform this action in this organization."),
            ("org_1_admin", None),
            ("org_2_admin", "You do not have permission to perform this action in this organization."),
        ],
    )
    def test_add_organization_member_permission(self, user: str, expected_error: Optional[str]) -> None:
        self.graphql_client.force_login(getattr(self, f"{user}"))

        mutation = """
            mutation ($data: OrgInvitationInput!) {
                addOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on OrganizationMemberType {
                        email
                    }
                }
            }
        """

        variables = {
            "email": "new+perm@example.com",
            "firstName": "new",
            "lastName": "guy",
            "organizationId": self.org_1.pk,
            "permissionTemplate": "CASEWORKER",
        }

        response = self.execute_graphql(mutation, {"data": variables})

        if expected_error:
            # Grant-only deny (require_can) is surfaced as an OperationInfo
            # payload — these mutations return ``T | OperationInfo``.
            self.assertIsNone(response.get("errors"), response.get("errors"))
            payload = response["data"]["addOrganizationMember"]
            self.assertEqual(payload["messages"][0]["message"], expected_error)
            with self.assertRaises(User.DoesNotExist):
                User.objects.get(email=variables["email"])
        else:
            self.assertIsNone(response.get("errors"), response.get("errors"))
            self.assertEqual(response["data"]["addOrganizationMember"]["email"], "new+perm@example.com")


class RemoveOrganizationMemberPermissionTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        # NOTE: use a dedicated removable member so we don't accidentally target the org owner
        self.org_member = baker.make(User, first_name="org member")
        self.removable_member = baker.make(
            User,
            first_name="removable member",
            email="removable@example.com",
        )
        self.org_1_admin = baker.make(User, first_name="org 1 admin")
        self.org_2_admin = baker.make(User, first_name="org 2 admin")

        self.org_1 = organization_recipe.make(name="org 1", owner=self.org_1_admin)
        self.org_2 = organization_recipe.make(name="org 2", owner=self.org_2_admin)

        self.org_1.add_user(self.org_member)
        self.org_1.add_user(self.removable_member)
        self._set_active_org(self.org_1)

    @parametrize(
        "user, expected_error",
        [
            ("org_member", "You do not have permission to perform this action in this organization."),
            ("org_1_admin", None),
            ("org_2_admin", "You do not have permission to perform this action in this organization."),
        ],
    )
    def test_remove_organization_member_permission(self, user: str, expected_error: Optional[str]) -> None:
        self.graphql_client.force_login(getattr(self, user))

        mutation = """
            mutation ($data: RemoveOrganizationMemberInput!) {
                removeOrganizationMember(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on DeletedObjectType {
                        id
                    }
                }
            }
        """

        variables = {
            "membershipId": OrganizationUser.objects.get(organization=self.org_1, user=self.removable_member).pk,
        }

        response = self.execute_graphql(mutation, {"data": variables})

        if expected_error:
            # Grant-only deny (require_can) is surfaced as an OperationInfo
            # payload — these mutations return ``T | OperationInfo``.
            self.assertIsNone(response.get("errors"), response.get("errors"))
            payload = response["data"]["removeOrganizationMember"]
            self.assertEqual(payload["messages"][0]["message"], expected_error)

            # membership should still exist
            self.assertTrue(
                OrganizationUser.objects.filter(
                    organization=self.org_1,
                    user=self.removable_member,
                ).exists()
            )

        else:
            self.assertIsNone(response.get("errors"), response.get("errors"))
            self.assertEqual(
                response["data"]["removeOrganizationMember"]["id"],
                self.removable_member.pk,
            )
            self.assertFalse(
                OrganizationUser.objects.filter(
                    organization=self.org_1,
                    user=self.removable_member,
                ).exists()
            )
            # user still exists
            self.assertTrue(User.objects.filter(pk=self.removable_member.pk).exists())
