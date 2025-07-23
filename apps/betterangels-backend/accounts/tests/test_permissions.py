from typing import Optional

from accounts.enums import OrgRoleEnum
from accounts.models import User
from accounts.utils import OrgPermissionManager
from common.tests.utils import GraphQLBaseTestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize

from .baker_recipes import organization_recipe


class OrganizationMemberPermissionTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_1 = organization_recipe.make(name="org 1")
        self.org_2 = organization_recipe.make(name="org 2")
        self.org_member = baker.make(User, first_name="org member")
        self.org_1_admin = baker.make(User, first_name="org 1 admin")
        self.org_2_admin = baker.make(User, first_name="org 2 admin")

        self.org_1.add_user(self.org_member)
        self.org_1.add_user(self.org_1_admin)
        self.org_2.add_user(self.org_member)
        self.org_2.add_user(self.org_2_admin)

        self.omb_1 = OrgPermissionManager(self.org_1)
        self.omb_1.set_role(self.org_1_admin, OrgRoleEnum.ADMIN)
        self.omb_2 = OrgPermissionManager(self.org_2)
        self.omb_2.set_role(self.org_2_admin, OrgRoleEnum.ADMIN)

    @parametrize(
        "user, expected_error",
        [
            ("org_member", "You don't have permission to access this app."),
            ("org_1_admin", None),
            ("org_2_admin", "You do not have permission to view this organization's members."),
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
            ("org_member", "org_1", 0, []),
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
                "You do not have permission to view this organization's members.",
            )
