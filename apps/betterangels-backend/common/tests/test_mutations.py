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
            self.address_input["addressComponents"][0]["long_name"] = street_number  # type: ignore
            self.address_input["addressComponents"] = json.dumps(self.address_input["addressComponents"])
            response = self._get_or_create_address_fixture(self.address_input)

            returned_address = response["data"]["getOrCreateAddress"]
            expected_address = {
                "id": ANY,
                "street": f"{street_number} Geary Street",
                "city": "San Francisco",
                "state": "CA",
                "zipCode": "94102",
            }

            self.assertEqual(expected_address_count, Address.objects.count())
            self.assertEqual(expected_address, returned_address)

    def test_get_or_create_address_mutation_missing_components(self) -> None:
        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()
            self.address_input["addressComponents"] = json.dumps([])

            response = self._get_or_create_address_fixture(self.address_input)

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
            self.address_input["addressComponents"].pop(missing_component_index)  # type: ignore
            self.address_input["addressComponents"] = json.dumps(self.address_input["addressComponents"])

            response = self._get_or_create_address_fixture(self.address_input)

            returned_address = response["data"]["getOrCreateAddress"]
            expected_address = {
                "id": ANY,
                "street": "Geary Street" if missing_component_index == 0 else None,
                "city": "San Francisco",
                "state": "CA",
                "zipCode": "94102",
            }

            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(expected_address, returned_address)
