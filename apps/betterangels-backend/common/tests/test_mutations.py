import json
from typing import Any, Dict
from unittest.mock import ANY

from common.models import Address
from common.tests.utils import LocationGraphQLBaseTestCase
from unittest_parametrize import parametrize


class LocationMutationTestCase(LocationGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    @parametrize(
        (
            "street_number",
            "expected_address_count",
            "include_standalone_point_of_interest",
            "include_component_point_of_interest",
            "expected_query_count",
        ),
        [
            ("200", 1, False, False, 10),
            ("201", 2, False, False, 15),
            ("200", 2, False, True, 15),
            ("200", 1, True, False, 12),
            ("200", 2, True, True, 15),
        ],
    )
    def test_get_or_create_location_mutation(
        self,
        street_number: str,
        expected_address_count: int,
        include_standalone_point_of_interest: bool,
        include_component_point_of_interest: bool,
        expected_query_count: int,
    ) -> None:
        with self.assertNumQueriesWithoutCache(expected_query_count):
            self.assertEqual(1, Address.objects.count())
            address_input: Dict[str, Any]
            json_address_input, address_input = self._get_address_inputs(
                street_number_override=street_number,
                include_point_of_interest=include_component_point_of_interest,
            )

            variables = {
                "address": json_address_input,
                "point": self.point,
                "pointOfInterest": (
                    "An Interesting Point (Standalone)" if include_standalone_point_of_interest else None
                ),
            }
            response = self._get_or_create_location_fixture(variables)

            returned_location = response["data"]["getOrCreateLocation"]

            assert isinstance(address_input["addressComponents"], list)
            expected_point_of_interest = None
            if include_component_point_of_interest:
                expected_point_of_interest = "An Interesting Point (Component)"
            if include_standalone_point_of_interest:
                expected_point_of_interest = "An Interesting Point (Standalone)"

            expected_location = {
                "id": ANY,
                "address": {
                    "street": f"{street_number} {address_input['addressComponents'][1]['long_name']}",
                    "city": address_input["addressComponents"][3]["long_name"],
                    "state": address_input["addressComponents"][5]["short_name"],
                    "zipCode": address_input["addressComponents"][7]["long_name"],
                },
                "point": self.point,
                "pointOfInterest": expected_point_of_interest,
            }
            self.assertEqual(expected_address_count, Address.objects.count())
            self.assertEqual(expected_location, returned_location)

    def test_create_location_mutation_missing_components(self) -> None:
        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()
            json_address_input, _ = self._get_address_inputs(delete_components=True)
            variables = {
                "address": json_address_input,
                "point": self.point,
            }
            response = self._get_or_create_location_fixture(variables)

            returned_location = response["data"]["getOrCreateLocation"]
            expected_location = {
                "id": ANY,
                "address": {
                    "street": None,
                    "city": None,
                    "state": None,
                    "zipCode": None,
                },
                "point": self.point,
                "pointOfInterest": None,
            }

            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(expected_location, returned_location)

    @parametrize(
        ("missing_component_index"),
        [
            (0,),  # Remove street number
            (1,),  # Remove route
        ],
    )
    def test_get_or_create_location_mutation_partial_street(self, missing_component_index: int) -> None:
        expected_query_count = 15
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()
            _, address_input = self._get_address_inputs()
            assert isinstance(address_input["addressComponents"], list)

            expected_city = address_input["addressComponents"][3]["long_name"]
            expected_state = address_input["addressComponents"][5]["short_name"]
            expected_zip_code = address_input["addressComponents"][7]["long_name"]
            address_input["addressComponents"].pop(missing_component_index)
            address_input["addressComponents"] = json.dumps(address_input["addressComponents"])
            variables = {
                "address": address_input,
                "point": self.point,
            }
            response = self._get_or_create_location_fixture(variables)

            returned_location = response["data"]["getOrCreateLocation"]
            expected_location = {
                "id": ANY,
                "address": {
                    "street": "Geary Street" if missing_component_index == 0 else None,
                    "city": expected_city,
                    "state": expected_state,
                    "zipCode": expected_zip_code,
                },
                "point": self.point,
                "pointOfInterest": None,
            }

            self.assertEqual(address_count + 1, Address.objects.count())
            self.assertEqual(expected_location, returned_location)
