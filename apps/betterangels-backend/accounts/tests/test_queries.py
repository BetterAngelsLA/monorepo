from typing import Any
from unittest.mock import ANY, patch

import time_machine
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.models import User
from accounts.permissions import UserOrganizationPermissions
from accounts.utils import OrgPermissionManager
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.test import ignore_warnings, override_settings
from hmis.api_bridge import HmisApiBridge
from hmis.tests.test_mutations import LOGIN_MUTATION
from model_bakery import baker
from organizations.models import Organization, OrganizationUser
from unittest_parametrize import ParametrizedTestCase, parametrize

from .baker_recipes import organization_recipe, permission_group_recipe


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(GraphQLBaseTestCase, ParametrizedTestCase):
    def test_anonymous_user_query(self) -> None:
        """
        Test querying the currentUser with an anonymous user.
        Expect a single error indicating the user is not logged in and
        that no user data is returned.
        """
        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """

        response = self.execute_graphql(query)

        self.assertGraphQLUnauthenticated(response)

    @parametrize(
        ("organization_count, is_outreach_authorized, expected_query_count"),
        [
            (0, False, 3),
            (1, True, 4),
            (2, True, 4),
        ],
    )
    def test_logged_in_user_query(
        self,
        organization_count: int,
        is_outreach_authorized: bool,
        expected_query_count: int,
    ) -> None:
        """
        Test querying the currentUser with a logged-in user.
        Expect no errors and the currentUser data to match the logged-in user's details.
        """
        user = baker.make(
            User,
            email="test@example.com",
            username="testuser",
            has_accepted_tos=True,
            has_accepted_privacy_policy=True,
        )
        self.graphql_client.force_login(user)

        expected_organizations = []

        for _ in range(organization_count):
            organization = organization_recipe.make()
            baker.make(OrganizationUser, user=user, organization=organization)
            permission_group_recipe.make(organization=organization)
            expected_organizations.append(
                {"id": str(organization.pk), "name": organization.name, "userPermissions": ANY}
            )

        query = """
            query {
                currentUser {
                    username
                    firstName
                    lastName
                    middleName
                    email
                    hasAcceptedTos
                    hasAcceptedPrivacyPolicy
                    isHmisUser
                    isOutreachAuthorized
                    organizations: organizationsOrganization {
                        id
                        name
                        userPermissions
                    }
                }
            }
        """

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        self.assertIsNone(response.get("errors"), "Expected no errors in the response")
        self.assertIn(
            "currentUser",
            response["data"],
            "'currentUser' data should be present in the response",
        )
        self.assertIsNotNone(response["data"]["currentUser"], "'currentUser' data should not be None")
        self.assertEqual(
            response["data"]["currentUser"]["email"],
            user.email,
            "Email does not match the logged-in user",
        )
        self.assertEqual(
            response["data"]["currentUser"]["username"],
            user.username,
            "Username does not match the logged-in user",
        )
        self.assertEqual(
            response["data"]["currentUser"]["firstName"],
            user.first_name,
        )
        self.assertEqual(
            response["data"]["currentUser"]["lastName"],
            user.last_name,
        )
        self.assertEqual(
            response["data"]["currentUser"]["middleName"],
            user.middle_name,
        )
        self.assertEqual(
            response["data"]["currentUser"]["isOutreachAuthorized"],
            is_outreach_authorized,
        )
        self.assertFalse(response["data"]["currentUser"]["isHmisUser"])
        self.assertEqual(
            response["data"]["currentUser"]["hasAcceptedTos"],
            user.has_accepted_tos,
        )
        self.assertEqual(
            response["data"]["currentUser"]["hasAcceptedPrivacyPolicy"],
            user.has_accepted_privacy_policy,
        )
        self.assertEqual(
            len(response["data"]["currentUser"]["organizations"]),
            organization_count,
        )
        self.assertCountEqual(response["data"]["currentUser"]["organizations"], expected_organizations)

    @override_settings(
        HMIS_TOKEN_KEY="LeUjRutbzg_txpcdszNmKbpX8rFiMWLnpJtPbF2nsS0=",
        HMIS_REST_URL="https://example.com",
        HMIS_HOST="example.com",
    )
    def test_logged_in_hmis_user_query(self) -> None:
        hmis_user = baker.make(get_user_model(), _fill_optional=["email"])
        token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImlhdCI6MTY3Mjc2NjAyOCwiZXhwIjoxNjc0NDk0MDI4fQ.kCak9sLJr74frSRVQp0_27BY4iBCgQSmoT3vQVWKzJg"

        with patch(
            "hmis.api_bridge.HmisApiBridge.login",
            autospec=True,
        ) as mock_login:
            mock_login.return_value = {
                "cookies": {"auth_token": token},
                "refresh_url": "https://example.com/refresh",
            }

            self.execute_graphql(
                LOGIN_MUTATION,
                variables={"email": hmis_user.email, "password": "anything"},
            )

        query = """
            query {
                currentUser {
                    isHmisUser
                }
            }
        """

        response = self.execute_graphql(query)
        self.assertTrue(response["data"]["currentUser"]["isHmisUser"])

    @parametrize(
        ("user_role, expected_permissions"),
        [
            (OrgRoleEnum.MEMBER, []),
            (
                OrgRoleEnum.ADMIN,
                [
                    UserOrganizationPermissions.ACCESS_ORG_PORTAL.name,
                    UserOrganizationPermissions.ADD_ORG_MEMBER.name,
                    UserOrganizationPermissions.REMOVE_ORG_MEMBER.name,
                    UserOrganizationPermissions.VIEW_ORG_MEMBERS.name,
                ],
            ),
            (
                OrgRoleEnum.SUPERUSER,
                [
                    UserOrganizationPermissions.ACCESS_ORG_PORTAL.name,
                    UserOrganizationPermissions.ADD_ORG_MEMBER.name,
                    UserOrganizationPermissions.REMOVE_ORG_MEMBER.name,
                    UserOrganizationPermissions.VIEW_ORG_MEMBERS.name,
                    UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE.name,
                ],
            ),
        ],
    )
    def test_logged_in_user_org_permissions_query(
        self, user_role: OrgRoleEnum, expected_permissions: list[str]
    ) -> None:
        user = baker.make(User)
        org_1 = organization_recipe.make(name="o1")
        org_2 = organization_recipe.make(name="o2")
        org_1.add_user(user)
        org_2.add_user(user)

        omb = OrgPermissionManager(org_1)

        self.graphql_client.force_login(user)

        query = """
            query {
                currentUser {
                    firstName
                    organizations: organizationsOrganization {
                        name
                        userPermissions
                    }
                }
            }
        """

        expected_query_count = 2

        omb.set_role(user, user_role)

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        user_perms = {o["name"]: o["userPermissions"] for o in response["data"]["currentUser"]["organizations"]}
        self.assertCountEqual(user_perms["o1"], expected_permissions)
        self.assertEqual(user_perms["o2"], [])


class OrganizationQueryTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def test_caseworker_organizations_query(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        # This recipe creates an organization in the process. Including this here because even though
        # Caseworker orgs are created elsewhere in the test suite, this test should be self-contained.
        permission_group_recipe.make(name="Caseworker")

        non_cw_org = organization_recipe.make()

        query = """
            query ($pagination: OffsetPaginationInput) {
                caseworkerOrganizations(pagination: $pagination) {
                    totalCount
                    results {
                        id
                        name
                    }
                    pageInfo {
                        offset
                        limit
                    }
                }
            }
        """
        variables = {"pagination": {"offset": 0, "limit": 10}}
        response = self.execute_graphql(query, variables=variables)

        caseworker_orgs = response["data"]["caseworkerOrganizations"]["results"]
        expected_caseworker_org_ids = list(
            Organization.objects.filter(permission_groups__name__icontains=GroupTemplateNames.CASEWORKER).values_list(
                "id", flat=True
            )
        )
        actual_caseworker_org_ids = [int(org["id"]) for org in caseworker_orgs]

        self.assertCountEqual(expected_caseworker_org_ids, actual_caseworker_org_ids)
        self.assertNotIn(non_cw_org.pk, actual_caseworker_org_ids)

    @parametrize(
        "search_term, expected_orgs",
        [
            (None, ["org_1", "org_2", "test_org"]),
            ("org_", ["org_1", "org_2"]),
            ("org_1", ["org_1"]),
            ("org 2", ["org_2"]),
            ("nonexistent org", []),
        ],
    )
    def test_caseworker_organizations_query_filter(self, search_term: str | None, expected_orgs: list[str]) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        query = """
            query ($pagination: OffsetPaginationInput, $filters: OrganizationFilter) {
                caseworkerOrganizations(pagination: $pagination, filters: $filters) {
                    totalCount
                    results {
                        id
                        name
                    }
                    pageInfo {
                        offset
                        limit
                    }
                }
            }
        """

        filters: dict[str, Any] = {"search": search_term}

        response = self.execute_graphql(query, variables={"filters": filters})

        actual_orgs = [org["name"] for org in response["data"]["caseworkerOrganizations"]["results"]]
        self.assertCountEqual(actual_orgs, expected_orgs)


class OrganizationMemberQueryTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org = organization_recipe.make(name="org")
        self.org_member = baker.make(User, first_name="member")
        self.org_admin = baker.make(User, first_name="ad", last_name="min", email="ad@org.co")
        self.org_superuser = baker.make(User, first_name="superuser")

        self.org.add_user(self.org_member)
        self.org.add_user(self.org_admin)
        self.org.add_user(self.org_superuser)

        omb = OrgPermissionManager(self.org)
        omb.set_role(self.org_admin, OrgRoleEnum.ADMIN)
        omb.set_role(self.org_superuser, OrgRoleEnum.SUPERUSER)

        another_org = organization_recipe.make(name="another_org")
        another_org.add_user(baker.make(User))

    @time_machine.travel("07-22-2025 10:00:00", tick=False)
    def test_organization_member_query(self) -> None:
        self.graphql_client.force_login(self.org_member)
        self.graphql_client.logout()
        self.graphql_client.force_login(self.org_admin)

        query = """
            query ($organizationId: String!, $userId: String!) {
                organizationMember(organizationId: $organizationId, userId: $userId) {
                    id
                    email
                    firstName
                    lastName
                    lastLogin
                    memberRole
                }
            }
        """

        variables = {
            "organizationId": str(self.org.pk),
            "userId": str(self.org_admin.pk),
        }

        with self.assertNumQueriesWithoutCache(6):
            response = self.execute_graphql(query, variables)

        expected_member = {
            "id": str(self.org_admin.pk),
            "email": "ad@org.co",
            "firstName": "ad",
            "lastName": "min",
            "lastLogin": "2025-07-22T10:00:00+00:00",
            "memberRole": OrgRoleEnum.ADMIN.name,
        }

        self.assertEqual(response["data"]["organizationMember"], expected_member)

    def test_organization_members_query(self) -> None:
        self.graphql_client.force_login(self.org_admin)

        query = """
            query ($organizationId: String!) {
                organizationMembers(organizationId: $organizationId) {
                    totalCount
                    results {
                        id
                        memberRole
                    }
                }
            }
        """

        variables = {"organizationId": str(self.org.pk)}

        with self.assertNumQueriesWithoutCache(7):
            response = self.execute_graphql(query, variables)

        expected_members = zip(
            [str(self.org_member.pk), str(self.org_admin.pk), str(self.org_superuser.pk)],
            [OrgRoleEnum.MEMBER.name, OrgRoleEnum.ADMIN.name, OrgRoleEnum.SUPERUSER.name],
        )
        actual_members = zip(
            [m["id"] for m in response["data"]["organizationMembers"]["results"]],
            [m["memberRole"] for m in response["data"]["organizationMembers"]["results"]],
        )
        self.assertEqual(response["data"]["organizationMembers"]["totalCount"], 3)
        self.assertCountEqual(expected_members, actual_members)
