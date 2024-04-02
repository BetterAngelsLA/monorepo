import json
import uuid
from typing import Any, Dict, Optional

from accounts.models import PermissionGroupTemplate, User
from accounts.tests.baker_recipes import permission_group_recipe
from django.contrib.contenttypes.models import ContentType
from django.contrib.sites.models import Site
from django.test import TestCase
from model_bakery import baker
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class GraphQLBaseTestCase(GraphQLTestCaseMixin, ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self._setup_users()
        self._setup_groups_and_permissions()

    def _setup_users(self) -> None:
        self.user_labels = [
            "org_1_case_manager_1",
            "org_1_case_manager_2",
            "org_2_case_manager_1",
            "client_1",
            "client_2",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}")
            for user_label in self.user_labels
        }

        self.org_1_case_manager_1 = self.user_map["org_1_case_manager_1"]
        self.org_1_case_manager_2 = self.user_map["org_1_case_manager_2"]
        self.org_2_case_manager_1 = self.user_map["org_2_case_manager_1"]
        self.client_1 = self.user_map["client_1"]
        self.client_2 = self.user_map["client_2"]

    def _setup_groups_and_permissions(self) -> None:
        caseworker_permission_group_template = PermissionGroupTemplate.objects.get(
            name="Caseworker"
        )
        perm_group = permission_group_recipe.make(
            template=caseworker_permission_group_template
        )
        perm_group.organization.add_user(self.org_1_case_manager_1)
        perm_group.organization.add_user(self.org_1_case_manager_2)

        # Create Another Org
        perm_group_2 = permission_group_recipe.make()
        perm_group_2.organization.add_user(self.org_2_case_manager_1)

    def _handle_user_login(self, user_label: Optional[str]) -> None:
        if user_label:
            self.graphql_client.force_login(self.user_map[user_label])
        else:
            self.graphql_client.logout()

    def assertNumQueriesWithoutCache(self, query_count: int) -> Any:
        """
        Resets all caches that may prevent query execution.
        Needed to ensure deterministic behavior of ``assertNumQueries`` (or
        after external changes to some Django database records).

        https://stackoverflow.com/a/55287613
        """
        ContentType.objects.clear_cache()
        Site.objects.clear_cache()
        return self.assertNumQueries(query_count)


class AddressGraphQLBaseTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self.address_components = [
            {"long_name": "200", "short_name": "200", "types": ["street_number"]},
            {
                "long_name": "Geary Street",
                "short_name": "Geary St",
                "types": ["route"],
            },
            {
                "long_name": "Union Square",
                "short_name": "Union Square",
                "types": ["neighborhood", "political"],
            },
            {
                "long_name": "San Francisco",
                "short_name": "SF",
                "types": ["locality", "political"],
            },
            {
                "long_name": "San Francisco County",
                "short_name": "San Francisco County",
                "types": ["administrative_area_level_2", "political"],
            },
            {
                "long_name": "California",
                "short_name": "CA",
                "types": ["administrative_area_level_1", "political"],
            },
            {
                "long_name": "United States",
                "short_name": "US",
                "types": ["country", "political"],
            },
            {"long_name": "94102", "short_name": "94102", "types": ["postal_code"]},
        ]
        self.formatted_address = (
            "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA"
        )
        self._setup_address()

    def _setup_address(self) -> None:
        # Force login to create an address
        self.graphql_client.force_login(self.org_1_case_manager_1)
        self.address = self._get_or_create_address_fixture(
            {
                "addressComponents": json.dumps(self.address_components),
                "formattedAddress": self.formatted_address,
            },
        )["data"]["getOrCreateAddress"]
        # Logout after setting up the address

        self.graphql_client.logout()

    def _get_or_create_address_fixture(
        self, variables: Dict[str, Any]
    ) -> Dict[str, Any]:
        mutation: str = """
            mutation GetOrCreateAddress($data: AddressInput!) { # noqa: B950
                getOrCreateAddress(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            field
                            message
                        }
                    }
                    ... on AddressType {
                        id
                        street
                        city
                        state
                        zipCode
                    }
                }
            }
        """
        return self.execute_graphql(mutation, {"data": variables})
