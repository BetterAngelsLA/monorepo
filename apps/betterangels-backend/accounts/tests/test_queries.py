from datetime import datetime, timedelta
from typing import Optional

import time_machine
from accounts.enums import GenderEnum, LanguageEnum, YesNoPreferNotToSayEnum
from accounts.models import ClientProfile, User
from accounts.tests.utils import ClientProfileGraphQLBaseTestCase
from accounts.types import MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS
from common.tests.utils import GraphQLBaseTestCase
from django.test import ignore_warnings
from model_bakery import baker
from notes.models import Note
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

        self.assertEqual(len(response["errors"]), 1, "Expected exactly one error")
        self.assertEqual(response["errors"][0]["message"], "User is not logged in.")
        self.assertIsNone(response["data"])

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
        user = baker.make(User, email="test@example.com", username="testuser")
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
                email
                username
                firstName
                middleName
                lastName
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
        self.assertEqual(
            len(response["data"]["currentUser"]["organizations"]),
            organization_count,
        )
        self.assertCountEqual(response["data"]["currentUser"]["organizations"], expected_organizations)


class ClientProfileQueryTestCase(ClientProfileGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_client_profile_query(self) -> None:
        client_profile_id = self.client_profile_1["id"]
        query = """
            query ViewClientProfile($id: ID!) {
                clientProfile(pk: $id) {
                    id
                    address
                    age
                    dateOfBirth
                    gender
                    hmisId
                    hmisProfiles {
                        id
                        hmisId
                        agency
                    }
                    nickname
                    phoneNumber
                    preferredLanguage
                    pronouns
                    spokenLanguages
                    veteranStatus
                    user {
                        id
                        firstName
                        lastName
                        middleName
                        email
                    }
                }
            }
        """

        variables = {"id": client_profile_id}
        expected_query_count = 4

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        returned_client = response["data"]["clientProfile"]

        expected_user = {
            "id": str(self.client_profile_1["user"]["id"]),
            "firstName": self.client_profile_1_user["firstName"],
            "lastName": self.client_profile_1_user["lastName"],
            "middleName": self.client_profile_1_user["middleName"],
            "email": self.client_profile_1_user["email"],
        }
        expected_hmis_profiles = [
            {
                "id": str(self.client_profile_1_hmis_profile_1.id),
                "hmisId": self.client_profile_1_hmis_profile_1.hmis_id,
                "agency": self.client_profile_1_hmis_profile_1.agency.name,
            },
            {
                "id": str(self.client_profile_1_hmis_profile_2.id),
                "hmisId": self.client_profile_1_hmis_profile_2.hmis_id,
                "agency": self.client_profile_1_hmis_profile_2.agency.name,
            },
        ]
        expected_client = {
            "id": str(client_profile_id),
            "address": self.client_profile_1["address"],
            "age": self.EXPECTED_CLIENT_AGE,
            "dateOfBirth": self.date_of_birth.strftime("%Y-%m-%d"),
            "gender": GenderEnum.MALE.name,
            "hmisId": self.client_profile_1["hmisId"],
            "hmisProfiles": expected_hmis_profiles,
            "nickname": self.client_profile_1["nickname"],
            "phoneNumber": self.client_profile_1["phoneNumber"],
            "preferredLanguage": LanguageEnum.ENGLISH.name,
            "pronouns": self.client_profile_1["pronouns"],
            "spokenLanguages": [LanguageEnum.ENGLISH.name, LanguageEnum.SPANISH.name],
            "veteranStatus": YesNoPreferNotToSayEnum.NO.name,
            "user": expected_user,
        }

        self.assertEqual(returned_client, expected_client)

    def test_client_profiles_query(self) -> None:
        query = """
            query ViewClientProfiles {
                clientProfiles{
                    id
                    address
                    age
                    dateOfBirth
                    gender
                    hmisId
                    hmisProfiles {
                        id
                        hmisId
                        agency
                    }
                    phoneNumber
                    preferredLanguage
                    pronouns
                    spokenLanguages
                    veteranStatus
                    user {
                        id
                        firstName
                        lastName
                        middleName
                        email
                    }
                }
            }
        """

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        client_profiles = response["data"]["clientProfiles"]
        client_profile_count = ClientProfile.objects.count()
        self.assertEqual(client_profile_count, len(client_profiles))

    @parametrize(
        ("sort_order, expected_first_name"),
        [("ASC", "Mister"), ("DESC", "Todd")],
    )
    def test_client_profiles_query_order(self, sort_order: Optional[str], expected_first_name: str) -> None:
        query = """
            query ViewClientProfiles($order: ClientProfileOrder) {
                clientProfiles(order: $order) {
                    id
                    user {
                        firstName
                    }
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"order": {"user_FirstName": sort_order}})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(client_profiles[0]["user"]["firstName"], expected_first_name)
        self.assertEqual(len(client_profiles), ClientProfile.objects.count())

    @parametrize(
        ("search_value, is_active, expected_client_profile_count"),
        [
            (None, None, 2),  # no filters
            (None, False, 1),  # active filter false
            (None, True, 1),  # active filter true
            ("tod ch gust toa", None, 1),  # name search matching inactive client
            ("tod", False, 1),  # first_name search matching inactive client + active filter false
            ("tod", True, 0),  # first_name search matching inactive client + active filter true
            ("pea mi tr", None, 0),  # name search matching matching no clients
            ("pea", False, 0),  # last_name search matching active client + active filter false
            ("pea", True, 1),  # last_name search matching active client + active filter true
            ("tod pea", None, 0),  # no match first_name, last_name search + active filter false
            ("HMISid", None, 2),  # hmis_id search matching both clients
            ("HMISid", False, 1),  # hmis_id search matching both clients + active filter false
            ("HMISid", True, 1),  # hmis_id search matching both clients + active filter true
            ("HMISidL", False, 1),  # hmis_id search matching inactive client
            ("HMISidL", True, 0),  # hmis_id search matching inactive client + active filter true
            ("HMISidP", False, 0),  # hmis_id search matching active client + active filter false
            ("HMISidP", True, 1),  # hmis_id search matching active client + active filter true
        ],
    )
    def test_client_profiles_query_search(
        self, search_value: Optional[str], is_active: Optional[bool], expected_client_profile_count: int
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        self.organization = organization_recipe.make()
        self.client_profile_1 = ClientProfile.objects.get(id=self.client_profile_1["id"])
        self.client_profile_2 = ClientProfile.objects.get(id=self.client_profile_2["id"])
        # Make two notes for Client 1 (Chavez, inactive)
        baker.make(Note, organization=self.organization, client=self.client_profile_1.user)
        baker.make(Note, organization=self.organization, client=self.client_profile_1.user)

        query = """
            query ClientProfiles($isActive: Boolean, $search: String) {
                clientProfiles(filters: {isActive: $isActive, search: $search}) {
                    id
                }
            }
        """

        # Advance time 91 days (active client threshold)
        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=MIN_INTERACTED_AGO_FOR_ACTIVE_STATUS["days"] + 1))

            # Make two notes for Client 2 (Peanutbutter, active)
            baker.make(Note, organization=self.organization, client=self.client_profile_2.user)
            baker.make(
                Note,
                organization=self.organization,
                client=self.client_profile_2.user,
            )

            expected_query_count = 3
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self.execute_graphql(query, variables={"search": search_value, "isActive": is_active})

        client_profiles = response["data"]["clientProfiles"]
        self.assertEqual(len(client_profiles), expected_client_profile_count)
