import json
import uuid
from typing import Any, Dict, List, Optional, Tuple, Union

from accounts.models import User
from accounts.tests.baker_recipes import organization_recipe
from common.constants import HMIS_SESSION_KEY_NAME
from common.models import Address, Location
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point

# ---------------------------------------------------------------------------
# Shared address fixture builder
# ---------------------------------------------------------------------------

# Canonical components — identical in both GraphQL (camelCase) and model
# (snake_case) tests.  Only the outer keys differ.
_ADDRESS_COMPONENTS: List[Dict[str, Any]] = [
    {"long_name": "106", "short_name": "106", "types": ["street_number"]},
    {"long_name": "West 1st Street", "short_name": "W 1st St", "types": ["route"]},
    {
        "long_name": "Downtown Los Angeles",
        "short_name": "Downtown Los Angeles",
        "types": ["neighborhood", "political"],
    },
    {"long_name": "Los Angeles", "short_name": "Los Angeles", "types": ["locality", "political"]},
    {
        "long_name": "Los Angeles County",
        "short_name": "Los Angeles County",
        "types": ["administrative_area_level_2", "political"],
    },
    {"long_name": "California", "short_name": "CA", "types": ["administrative_area_level_1", "political"]},
    {"long_name": "United States", "short_name": "US", "types": ["country", "political"]},
    {"long_name": "90012", "short_name": "90012", "types": ["postal_code"]},
]

_FORMATTED_ADDRESS = "106 West 1st Street, Los Angeles, CA 90012, USA"

_POI_COMPONENT: Dict[str, Any] = {
    "long_name": "An Interesting Point (Component)",
    "short_name": "An Interesting Point (Component)",
    "types": ["point_of_interest"],
}


def build_address_inputs(
    *,
    camel_case: bool = True,
    street_number_override: Optional[str] = None,
    delete_street_number: bool = False,
    include_point_of_interest: bool = False,
    delete_components: bool = False,
) -> Tuple[Dict[str, str], Dict[str, Union[str, List[Dict[str, Any]]]]]:
    """Build address test fixture data.

    Returns ``(json_address_input, address_input)`` — the first has
    JSON-serialised components (suitable for mutation variables), the second has
    the raw list (suitable for assertions).

    *camel_case* controls the outer key names:
    ``True``  → ``addressComponents`` / ``formattedAddress``  (GraphQL tests)
    ``False`` → ``address_components`` / ``formatted_address`` (model tests)
    """
    comp_key = "addressComponents" if camel_case else "address_components"
    fmt_key = "formattedAddress" if camel_case else "formatted_address"

    components = [dict(c) for c in _ADDRESS_COMPONENTS]  # shallow copy each

    if street_number_override:
        components[0] = {**components[0], "long_name": street_number_override}

    if delete_street_number:
        components.pop(0)

    if include_point_of_interest:
        components.append(dict(_POI_COMPONENT))

    if delete_components:
        components = []

    address_input: Dict[str, Union[str, List[Dict[str, Any]]]] = {
        comp_key: components,
        fmt_key: _FORMATTED_ADDRESS,
    }

    json_address_input: Dict[str, str] = {
        fmt_key: _FORMATTED_ADDRESS,
        comp_key: json.dumps(components),
    }

    return json_address_input, address_input


from django.contrib.sites.models import Site
from django.test import TestCase
from model_bakery import baker
from test_utils.assert_mixins import GraphQLAssertionsMixin
from test_utils.mixins import GraphQLTestCaseMixin
from unittest_parametrize import ParametrizedTestCase


class GraphQLBaseTestCase(GraphQLTestCaseMixin, GraphQLAssertionsMixin, ParametrizedTestCase, TestCase):
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
            "non_case_manager_user",
        ]
        self.user_map = {
            user_label: baker.make(User, username=f"{user_label}_{uuid.uuid4()}") for user_label in self.user_labels
        }
        self.org_1_case_manager_1 = self.user_map["org_1_case_manager_1"]
        self.org_1_case_manager_2 = self.user_map["org_1_case_manager_2"]
        self.org_2_case_manager_1 = self.user_map["org_2_case_manager_1"]
        self.non_case_manager_user = self.user_map["non_case_manager_user"]

    def _setup_groups_and_permissions(self) -> None:
        self.org_1 = organization_recipe.make(name="org_1")
        self.org_2 = organization_recipe.make(name="org_2")
        # A "caseworker" permission group is automatically created for an org when its first user is added
        # see: apps/betterangels-backend/accounts/signals.py -> handle_organization_user_added
        self.org_1.add_user(self.org_1_case_manager_1)
        self.org_1.add_user(self.org_1_case_manager_2)
        self.org_2.add_user(self.org_2_case_manager_1)

    def _setup_hmis_session(self) -> None:
        """
        Helper method to set up HMIS session for testing.
        Sets the HMIS session key in the test client's session.
        """

        session = self.graphql_client.session
        session[HMIS_SESSION_KEY_NAME] = "enc_token"
        session.modified = True
        session.save()

    def _clear_hmis_session(self) -> None:
        session = self.graphql_client.session
        session[HMIS_SESSION_KEY_NAME] = None
        session.modified = True
        session.save()

    def _get_address_inputs(
        self,
        street_number_override: Optional[str] = None,
        delete_street_number: bool = False,
        include_point_of_interest: bool = False,
        delete_components: bool = False,
    ) -> Tuple[Dict[str, str], Dict[str, Union[str, List[Dict[str, Any]]]]]:
        """Returns address input in two formats. JSON, for use in the mutation, and a dictionary for test assertions."""
        return build_address_inputs(
            camel_case=True,
            street_number_override=street_number_override,
            delete_street_number=delete_street_number,
            include_point_of_interest=include_point_of_interest,
            delete_components=delete_components,
        )

    def _setup_location(self) -> None:
        self.address = baker.make(
            Address,
            street=self.street,
            city=self.city,
            state=self.state,
            zip_code=self.zip_code,
        )
        self.point = [-118.24372, 34.05217]
        self.point_of_interest = "An Interesting Point"
        self.location = baker.make(
            Location,
            address=self.address,
            point=Point(self.point),
            point_of_interest=self.point_of_interest,
        )

    def _delete_fixture(self, object: str, object_id: str) -> Dict[str, Any]:
        mutation = f"""
            mutation ($id: ID!) {{
                delete{object}(data: {{ id: $id }}) {{
                    ... on OperationInfo {{
                        messages {{
                            kind
                            field
                            message
                        }}
                    }}
                    ... on {object}Type {{
                        id
                    }}
                }}
            }}
        """
        variables = {"id": object_id}

        return self.execute_graphql(mutation, variables)

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
