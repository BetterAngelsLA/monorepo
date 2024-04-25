import json
from typing import Any, Dict
from unittest.mock import ANY

from common.models import Address
from common.tests.utils import AddressGraphQLBaseTestCase, LocationGraphQLBaseTestCase
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
            address_input: Dict[str, Any]
            json_address_input, address_input = self._get_address_inputs(street_number_override=street_number)
            response = self._get_or_create_address_fixture(json_address_input)

            returned_address = response["data"]["getOrCreateAddress"]
            assert isinstance(address_input["addressComponents"], list)
            expected_address = {
                "id": ANY,
                "street": f"{street_number} {address_input['addressComponents'][1]['long_name']}",
                "city": address_input["addressComponents"][3]["long_name"],
                "state": address_input["addressComponents"][5]["short_name"],
                "zipCode": address_input["addressComponents"][7]["long_name"],
            }

            self.assertEqual(expected_address_count, Address.objects.count())
            self.assertEqual(expected_address, returned_address)

    def test_get_or_create_address_mutation_missing_components(self) -> None:
        expected_query_count = 11
        with self.assertNumQueriesWithoutCache(expected_query_count):
            address_count = Address.objects.count()
            json_address_input, _ = self._get_address_inputs(delete_components=True)

            response = self._get_or_create_address_fixture(json_address_input)

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
            _, address_input = self._get_address_inputs()
            assert isinstance(address_input["addressComponents"], list)

            expected_city = address_input["addressComponents"][3]["long_name"]
            expected_state = address_input["addressComponents"][5]["short_name"]
            expected_zip_code = address_input["addressComponents"][7]["long_name"]
            address_input["addressComponents"].pop(missing_component_index)
            address_input["addressComponents"] = json.dumps(address_input["addressComponents"])

            response = self._get_or_create_address_fixture(address_input)

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


class LocationMutationTestCase(LocationGraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()
        self._handle_user_login("org_1_case_manager_1")

    # @parametrize(
    #     ("street_number", "expected_address_count", "include_point_of_interest", "expected_query_count"),
    #     [
    #         # ("200", 1, False, 12),
    #         # ("201", 2, False, 15),
    #         ("202", 2, True, 15),
    #     ],
    # )
    def test_create_location_mutation(
        self,
        street_number: str,
        expected_address_count: int,
        include_point_of_interest: bool,
        expected_query_count: int,
    ) -> None:
        with self.assertNumQueriesWithoutCache(expected_query_count):
            print("ayyyyyy")
            from IPython import embed

            embed()
            self.assertEqual(1, Address.objects.count())
            address_input: Dict[str, Any]
            json_address_input, address_input = self._get_address_inputs()
            # json_address_input, address_input = self._get_address_inputs(
            #     street_number_override=street_number,
            #     include_point_of_interest=include_point_of_interest,
            # )
            variables = {
                "address": json_address_input,
                "point": self.point,
            }
            response = self._create_location_fixture(variables)

            returned_location = response["data"]["createLocation"]

            assert isinstance(address_input["addressComponents"], list)
            expected_location = {
                "id": ANY,
                "address": {
                    "street": f"{street_number} {address_input['addressComponents'][1]['long_name']}",
                    "city": address_input["addressComponents"][3]["long_name"],
                    "state": address_input["addressComponents"][5]["short_name"],
                    "zipCode": address_input["addressComponents"][7]["long_name"],
                },
                "point": self.point,
                "pointOfInterest": (
                    address_input["addressComponents"][-1]["long_name"] if include_point_of_interest else None
                ),
            }

            self.assertEqual(expected_address_count, Address.objects.count())
            self.assertEqual(expected_location, returned_location)

    # def test_create_location_mutation_missing_components(self) -> None:
    #     expected_query_count = 15
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         address_count = Address.objects.count()
    #         json_address_input, _ = self._get_address_inputs(delete_components=True)
    #         variables = {
    #             "address": json_address_input,
    #             "point": self.point,
    #         }
    #         response = self._create_location_fixture(variables)

    #         returned_location = response["data"]["createLocation"]
    #         expected_location = {
    #             "id": ANY,
    #             "address": {
    #                 "street": None,
    #                 "city": None,
    #                 "state": None,
    #                 "zipCode": None,
    #             },
    #             "point": self.point,
    #             "pointOfInterest": None,
    #         }

    #         self.assertEqual(address_count + 1, Address.objects.count())
    #         self.assertEqual(expected_location, returned_location)

    # @parametrize(
    #     ("missing_component_index"),
    #     [
    #         (0,),  # Remove street number
    #         (1,),  # Remove route
    #     ],
    # )
    # def test_create_location_mutation_partial_street(self, missing_component_index: int) -> None:
    #     expected_query_count = 15
    #     with self.assertNumQueriesWithoutCache(expected_query_count):
    #         address_count = Address.objects.count()
    #         _, address_input = self._get_address_inputs()
    #         assert isinstance(address_input["addressComponents"], list)

    #         expected_city = address_input["addressComponents"][3]["long_name"]
    #         expected_state = address_input["addressComponents"][5]["short_name"]
    #         expected_zip_code = address_input["addressComponents"][7]["long_name"]
    #         address_input["addressComponents"].pop(missing_component_index)
    #         address_input["addressComponents"] = json.dumps(address_input["addressComponents"])
    #         variables = {
    #             "address": address_input,
    #             "point": self.point,
    #         }
    #         response = self._create_location_fixture(variables)

    #         returned_location = response["data"]["createLocation"]
    #         expected_location = {
    #             "id": ANY,
    #             "address": {
    #                 "street": "Geary Street" if missing_component_index == 0 else None,
    #                 "city": expected_city,
    #                 "state": expected_state,
    #                 "zipCode": expected_zip_code,
    #             },
    #             "point": self.point,
    #             "pointOfInterest": None,
    #         }

    #         self.assertEqual(address_count + 1, Address.objects.count())
    #         self.assertEqual(expected_location, returned_location)
