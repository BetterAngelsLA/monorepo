from datetime import datetime, timedelta
from typing import Optional

import time_machine
from accounts.models import Client, User
from accounts.tests.utils import ClientGraphQLBaseTestCase
from django.test import TestCase, ignore_warnings
from IPython import embed
from model_bakery import baker
from notes.models import Note
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import parametrize

from .baker_recipes import organization_recipe


@ignore_warnings(category=UserWarning)
class CurrentUserGraphQLTests(GraphQLTestCaseMixin, TestCase):
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

    def test_logged_in_user_query(self) -> None:
        """
        Test querying the currentUser with a logged-in user.
        Expect no errors and the currentUser data to match the logged-in user's details.
        """
        user = baker.make(User, email="test@example.com", username="testuser")
        self.graphql_client.force_login(user)

        query = """
        query {
            currentUser {
                email
                username
            }
        }
        """
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


class ClientQueryTestCase(ClientGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def test_get_client_query(self) -> None:
        client_id = self.client_1["id"]
        embed
        query = """
            query ViewClient($id: ID!) {
                client(pk: $id) {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """

        variables = {"id": client_id}
        expected_query_count = 3

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables)

        returned_client = response["data"]["client"]
        expected_client = {
            "id": str(client_id),
            "firstName": self.client_1["firstName"],
            "lastName": self.client_1["lastName"],
            "email": self.client_1["email"],
        }

        self.assertEqual(returned_client, expected_client)

    def test_get_clients_query(self) -> None:
        query = """
            query GetClients {
                clients {
                    id
                    firstName
                    lastName
                    email
                }
            }
        """
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query)

        clients = response["data"]["clients"]
        client_count = User.objects.filter(client_profile__isnull=False).count()
        self.assertEqual(client_count, len(clients))

    @parametrize(
        ("search_value, is_active, expected_client_count"),
        [
            (None, False, 2),  # no filter parameters
            (None, True, 1),  # active filter
            ("tod", False, 1),  # first_name search matching active client
            ("tod", True, 0),  # first_name search matching active client + active filter
            ("pea", False, 1),  # last_name search matching inactive client
            ("pea", True, 1),  # last_name search matching inactive client + active filter
            ("tod pea", False, 0),  # no match first_name, last_name search
            ("tod pea", True, 0),  # no match first_name, last_name search + active filter
            ("A1B", False, 2),  # hmis_id search matching both clients
            ("A1B", True, 1),  # hmis_id search matching both clients + active filter
            ("A1B2", False, 1),  # hmis_id search matching inactive client
            ("A1B2", True, 0),  # hmis_id search matching inactive client + active filter
            ("A1B3", False, 1),  # hmis_id search matching active client
            ("A1B3", True, 1),  # hmis_id search matching active client + active filter
        ],
    )
    def test_clients_query_search(
        self, search_value: Optional[str], is_active: Optional[bool], expected_client_count: int
    ) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        self.organization = organization_recipe.make()
        self.client_1 = Client.objects.get(id=self.client_1["id"])
        self.client_2 = Client.objects.get(id=self.client_2["id"])
        baker.make(
            Note,
            organization=self.organization,
            client=self.client_1,
        )

        query = """
            query Clients($active: Boolean, $search: String) {
                clients(filters: {active: $active, search: $search}) {
                    id
                }
            }
        """

        ACTIVE_CLIENT_THRESHOLD_DAYS = 90

        with time_machine.travel(datetime.now(), tick=False) as traveller:
            traveller.shift(timedelta(days=ACTIVE_CLIENT_THRESHOLD_DAYS + 91))

            baker.make(
                Note,
                organization=self.organization,
                client=self.client_2,
            )

            expected_query_count = 3
            with self.assertNumQueriesWithoutCache(expected_query_count):
                response = self.execute_graphql(query, variables={"search": search_value, "active": is_active})

        clients = response["data"]["clients"]
        self.assertEqual(expected_client_count, len(clients))
