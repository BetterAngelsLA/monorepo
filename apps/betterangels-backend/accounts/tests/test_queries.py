from unittest.mock import ANY, patch

import time_machine
from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import User
from accounts.permissions import UserOrganizationPermissions
from accounts.role_manager import OrgRoleManager
from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth import get_user_model
from django.test import ignore_warnings, override_settings
from hmis.tests.test_mutations import LOGIN_MUTATION
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import OrganizationUser
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
            (1, False, 3),
            (2, False, 3),
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
            expected_organizations.append({"id": str(organization.pk), "name": organization.name})

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

        with patch(
            "hmis.api_bridge.HmisApiBridge.login",
            autospec=True,
        ) as mock_login:
            mock_login.return_value = None

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
            (
                OrgRoleEnum.MEMBER,
                [],
            ),
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
                    UserOrganizationPermissions.CHANGE_ORG_MEMBER_ROLE.name,
                    UserOrganizationPermissions.REMOVE_ORG_MEMBER.name,
                    UserOrganizationPermissions.VIEW_ORG_MEMBERS.name,
                ],
            ),
        ],
    )
    def test_logged_in_user_org_permissions_query(self, user_role: OrgRoleEnum, expected_permissions: list) -> None:
        user = baker.make(User)
        org_1 = organization_recipe.make(name="o1")
        org_2 = organization_recipe.make(name="o2")
        org_1.add_user(user)
        org_2.add_user(user)

        omb = OrgRoleManager(org_1)

        self.graphql_client.force_login(user)

        query = """
            query {
                currentUser {
                    firstName
                    organizations: organizationsOrganization {
                        name
                        permissions {
                            accounts
                        }
                    }
                }
            }
        """

        expected_query_count = 2

        if user_role == OrgRoleEnum.MEMBER:
            pass  # no roles assigned
        elif user_role == OrgRoleEnum.ADMIN:
            omb.add_roles(user, CASEWORKER, ORG_ADMIN)
        elif user_role == OrgRoleEnum.SUPERUSER:
            omb.add_roles(user, CASEWORKER, ORG_SUPERUSER)

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        org_perms = {
            o["name"]: sorted(o["permissions"]["accounts"]) for o in response["data"]["currentUser"]["organizations"]
        }
        self.assertEqual(org_perms["o1"], sorted(expected_permissions))
        self.assertEqual(
            org_perms["o2"],
            [],
        )


class OrganizationMemberQueryTestCase(GraphQLBaseTestCase, ParametrizedTestCase):
    def setUp(self) -> None:
        super().setUp()

        self.org_member = baker.make(User, first_name="member")
        self.org_admin = baker.make(User, first_name="ad", last_name="min", email="ad@org.co")
        self.org_superuser = baker.make(User, first_name="superuser")

        self.org = organization_recipe.make(name="org", owner=self.org_admin)

        self.org.add_user(self.org_member)
        self.org.add_user(self.org_superuser)

        omb = OrgRoleManager(self.org)
        omb.add_roles(self.org_superuser, CASEWORKER, ORG_SUPERUSER)

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
                    dateJoined
                    memberRole
                }
            }
        """

        variables = {
            "organizationId": str(self.org.pk),
            "userId": str(self.org_admin.pk),
        }

        with self.assertNumQueriesWithoutCache(5):
            response = self.execute_graphql(query, variables)

        expected_member = {
            "id": str(self.org_admin.pk),
            "email": "ad@org.co",
            "firstName": "ad",
            "lastName": "min",
            "lastLogin": "2025-07-22T10:00:00+00:00",
            "dateJoined": ANY,
            "memberRole": OrgRoleEnum.ADMIN.name,
        }

        self.assertEqual(response["data"]["organizationMember"], expected_member)
        self.assertIsNotNone(response["data"]["organizationMember"]["dateJoined"])

    def test_organization_members_query(self) -> None:
        self.graphql_client.force_login(self.org_admin)

        query = """
            query ($organizationId: String!) {
                organizationMembers(organizationId: $organizationId) {
                    totalCount
                    results {
                        id
                        dateJoined
                        memberRole
                    }
                }
            }
        """

        variables = {"organizationId": str(self.org.pk)}

        with self.assertNumQueriesWithoutCache(6):
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

    @parametrize(
        "search_term, expected_match, expected_min_total_count",
        [
            ("jo smi", ("John", "Smith"), None),
            ("john s", ("John", "Smith"), None),
            ("s", None, 3),
        ],
    )
    def test_organization_members_search(
        self,
        search_term: str,
        expected_match: tuple[str, str] | None,
        expected_min_total_count: int | None,
    ) -> None:
        self.graphql_client.force_login(self.org_admin)

        john_user = baker.make(User, first_name="John", last_name="Smith", email="john.smith@example.com")
        non_match_user = baker.make(User, first_name="Johnny", last_name="Doe", email="johnny.doe@example.com")

        self.org.add_user(john_user)
        self.org.add_user(non_match_user)

        query = """
            query ($organizationId: String!, $filters: OrganizationMemberFilter) {
                organizationMembers(
                    organizationId: $organizationId,
                    filters: $filters
                ) {
                    totalCount
                    results {
                        firstName
                        lastName
                        dateJoined
                    }
                }
            }
        """

        response = self.execute_graphql(
            query,
            variables={
                "organizationId": str(self.org.pk),
                "filters": {"search": search_term},
            },
        )

        members = response["data"]["organizationMembers"]
        if expected_match is None:
            self.assertIsNotNone(expected_min_total_count)
            self.assertGreaterEqual(members["totalCount"], expected_min_total_count)
            return

        results = members["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["firstName"], expected_match[0])
        self.assertEqual(results[0]["lastName"], expected_match[1])
        self.assertTrue(
            all(member["dateJoined"] is not None for member in response["data"]["organizationMembers"]["results"])
        )
