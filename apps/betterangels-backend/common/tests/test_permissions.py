from common.models import Address, Location
from common.tests.utils import LocationGraphQLBaseTestCase
from unittest_parametrize import parametrize


class LocationPermissionTestCase(LocationGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case Manager user should succeed
            ("org_2_case_manager_1", True),  # Case Manager user should succeed
            # TODO: We'll probably give Clients access to this at some point.
            ("client_user_1", False),  # Client user should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_create_location_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        address_count = Address.objects.count()
        location_count = Location.objects.count()

        # Change the street number so we can create a new address.
        json_address_input, _ = self._get_address_inputs(street_number_override="201")
        variables = {
            "address": json_address_input,
            "point": self.point,
        }
        response = self._get_or_create_location_fixture(variables)

        if should_succeed:
            self.assertIsNotNone(response["data"]["getOrCreateLocation"]["id"])
            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(location_count + 1, Location.objects.count())
        else:
            self.assertEqual(
                response["data"]["getOrCreateLocation"]["messages"][0],
                {
                    "kind": "PERMISSION",
                    "field": "getOrCreateLocation",
                    "message": "You don't have permission to access this app.",
                },
            )
            self.assertEqual(address_count, Address.objects.count())
            self.assertEqual(location_count, Location.objects.count())

    @parametrize(
        "user_label, should_succeed",
        [
            ("org_1_case_manager_1", True),  # Case Manager user should succeed
            ("org_2_case_manager_1", True),  # Case Manager user should succeed
            # TODO: We'll probably give Clients access to this at some point.
            ("client_user_1", False),  # Non CM should not succeed
            (None, False),  # Anonymous user should not succeed
        ],
    )
    def test_view_location_permission(self, user_label: str, should_succeed: bool) -> None:
        self._handle_user_login(user_label)

        query = """
            query ViewLocation($id: ID!) {
                location(pk: $id) {
                    id
                    address {
                        street
                        city
                        state
                        zipCode
                    }
                    point
                    pointOfInterest
                }
            }
        """
        variables = {"id": self.location["id"]}
        response = self.execute_graphql(query, variables)

        if should_succeed:
            self.assertIsNotNone(response["data"])
        else:
            self.assertIsNotNone(response["errors"])
