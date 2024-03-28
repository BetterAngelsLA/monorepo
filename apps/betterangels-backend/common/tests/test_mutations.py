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
        ("street_number", "expected_db_rows", "expected_query_count"),
        [
            ("200", 1, 8),
            ("201", 2, 11),
        ],
    )
    def test_get_or_create_address_mutation(
        self, street_number: str, expected_db_rows: int, expected_query_count: int
    ) -> None:
        with self.assertNumQueries(expected_query_count):
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

            self.assertEqual(expected_db_rows, Address.objects.count())
            self.assertEqual(expected_address, returned_address)
