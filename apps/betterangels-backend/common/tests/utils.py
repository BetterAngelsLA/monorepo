import json
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

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

        # This is for the address used by most tests
        self.street = "106 West 1st Street"
        self.city = "Los Angeles"
        self.state = "CA"
        self.zip_code = "90012"

    def _setup_users(self) -> None:
        self.user_labels = [
            "org_1_case_manager_1",
            "org_1_case_manager_2",
            "org_2_case_manager_1",
            "demo_user",
            # Calling these client_users because they're note Client instances,
            # but ordinary users created to facilitate testing.
            "client_user_1",
            "client_user_2",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}") for user_label in self.user_labels
        }
        self.org_1_case_manager_1 = self.user_map["org_1_case_manager_1"]
        self.org_1_case_manager_2 = self.user_map["org_1_case_manager_2"]
        self.org_2_case_manager_1 = self.user_map["org_2_case_manager_1"]
        self.demo_user = self.user_map["demo_user"]
        self.client_user_1 = self.user_map["client_user_1"]
        self.client_user_1.first_name = "Dale"
        self.client_user_1.last_name = "Cooper"
        self.client_user_1.save()
        self.client_user_2 = self.user_map["client_user_2"]
        self.client_user_2.first_name = "Harry"
        self.client_user_2.last_name = "Truman"
        self.client_user_2.save()
        self.demo_user = self.user_map["demo_user"]
        self.demo_user.email = "test+demo@example.com"
        self.demo_user.save()

    def _setup_groups_and_permissions(self) -> None:
        caseworker_permission_group_template = PermissionGroupTemplate.objects.get(name="Caseworker")
        caseworker_perm_group = permission_group_recipe.make(template=caseworker_permission_group_template)
        caseworker_perm_group.organization.add_user(self.org_1_case_manager_1)
        caseworker_perm_group.organization.add_user(self.org_1_case_manager_2)

        demo_permission_group_template = PermissionGroupTemplate.objects.get(name="Demo")
        demo_perm_group = permission_group_recipe.make(template=demo_permission_group_template)
        demo_perm_group.organization.name = "Demo Org"
        demo_perm_group.organization.save()
        demo_perm_group.organization.add_user(self.demo_user)

        # Create Another Org
        caseworked_perm_group_2 = permission_group_recipe.make()
        caseworked_perm_group_2.organization.add_user(self.org_2_case_manager_1)

    def _get_address_inputs(
        self,
        street_number_override: Optional[str] = None,
        delete_street_number: bool = False,
        include_point_of_interest: bool = False,
        delete_components: bool = False,
    ) -> Tuple[Dict[str, str], Dict[str, Union[str, List[Dict[str, Any]]]]]:
        """Returns address input in two formats. JSON, for use in the mutation, and a dictionary for test assertions."""
        address_input: Dict[str, Union[str, List[Dict[str, Any]]]] = {
            "addressComponents": [
                {
                    "long_name": "106",
                    "short_name": "106",
                    "types": ["street_number"],
                },
                {
                    "long_name": "West 1st Street",
                    "short_name": "W 1st St",
                    "types": ["route"],
                },
                {
                    "long_name": "Downtown Los Angeles",
                    "short_name": "Downtown Los Angeles",
                    "types": ["neighborhood", "political"],
                },
                {
                    "long_name": "Los Angeles",
                    "short_name": "Los Angeles",
                    "types": ["locality", "political"],
                },
                {
                    "long_name": "Los Angeles County",
                    "short_name": "Los Angeles County",
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
                {"long_name": "90012", "short_name": "90012", "types": ["postal_code"]},
            ],
            "formattedAddress": "106 West 1st Street, Los Angeles, CA 90012, USA",
        }

        if isinstance(address_input["addressComponents"], list):
            if street_number_override:
                address_input["addressComponents"][0]["long_name"] = street_number_override

            if delete_street_number:
                address_input["addressComponents"].pop(0)

            if include_point_of_interest:
                address_input["addressComponents"].append(
                    {
                        "long_name": "An Interesting Point (Component)",
                        "short_name": "An Interesting Point (Component)",
                        "types": ["point_of_interest"],
                    },
                )

            if delete_components:
                address_input["addressComponents"] = []

        json_address_input: Dict[str, str] = {"formattedAddress": str(address_input["formattedAddress"])}
        json_address_input["addressComponents"] = json.dumps(address_input["addressComponents"])

        return json_address_input, address_input

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
