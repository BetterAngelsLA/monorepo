import json
from unittest.mock import ANY

from common.models import Address
from common.tests.utils import AddressGraphQLBaseTestCase
from unittest_parametrize import parametrize


class AddressMutationTestCase(AddressGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    @parametrize(
        ("street_number", "expected_address_count", "expected_query_count"),
        [
            ("200", 1, 8),
            ("201", 2, 11),
        ],
    )
    def test_get_or_create_address_mutation(
        self, street_number: str, expected_address_count: int, expected_query_count: int
    ) -> None:
        with self.assertNumQueriesWithoutCache(expected_query_count):
            self.assertEqual(1, Address.objects.count())

            self.address_components[0]["long_name"] = street_number

            response = self._get_or_create_address_fixture(
                {
                    "addressComponents": json.dumps(self.address_components),
                    "formattedAddress": self.formatted_address,
                }
            )

            returned_address = response["data"]["getOrCreateAddress"]
            expected_address = {
                "id": ANY,
                "street": f"{street_number} {self.address_components[1]['long_name']}",
                "city": self.address_components[3]["long_name"],
                "state": self.address_components[5]["short_name"],
                "zipCode": self.address_components[7]["long_name"],
            }

            self.assertEqual(expected_address_count, Address.objects.count())
            self.assertEqual(expected_address, returned_address)

    def test_get_or_create_address_mutation_missing_components(self) -> None:
        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()

            self.address_components = []
            response = self._get_or_create_address_fixture(
                {
                    "addressComponents": json.dumps(self.address_components),
                    "formattedAddress": self.formatted_address,
                }
            )

            returned_address = response["data"]["getOrCreateAddress"]
            expected_address = {
                "id": ANY,
                "street": None,
                "city": None,
                "state": None,
                "zipCode": None,
            }

            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(expected_address, returned_address)

    @parametrize(
        ("missing_component_index"),
        [
            (0,),  # Remove street number
            (1,),  # Remove route
        ],
    )
    def test_get_or_create_address_mutation_partial_street(self, missing_component_index: int) -> None:
        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()

            expected_city = self.address_components[3]["long_name"]
            expected_state = self.address_components[5]["short_name"]
            expected_zip_code = self.address_components[7]["long_name"]

            self.address_components.pop(missing_component_index)

            response = self._get_or_create_address_fixture(
                {
                    "addressComponents": json.dumps(self.address_components),
                    "formattedAddress": self.formatted_address,
                }
            )

            returned_address = response["data"]["getOrCreateAddress"]
            expected_address = {
                "id": ANY,
                "street": "Geary Street" if missing_component_index == 0 else None,
                "city": expected_city,
                "state": expected_state,
                "zipCode": expected_zip_code,
            }

            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(expected_address, returned_address)
