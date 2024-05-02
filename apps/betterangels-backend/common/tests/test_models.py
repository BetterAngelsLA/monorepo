import json
import stat
from typing import Any, Dict, List, Optional, Tuple, Union

from common.models import Address, Location
from django.contrib.gis.geos import Point
from django.test import TestCase
from model_bakery import baker

# from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize


class LocationModelTest(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        self.point = (-118.2437207, 34.0521723)
        self._setup_location()

    def _setup_location(self) -> None:
        # Force login to create a location
        address_input: Dict[str, List]
        json_address_input, address_input = self._get_address_inputs()
        self.address = baker.make(
            Address,
            street=f"{address_input['address_components'][0]['long_name']} {address_input['address_components'][1]['long_name']}",
            city=address_input["address_components"][3]["long_name"],
            state=address_input["address_components"][5]["short_name"],
            zip_code=address_input["address_components"][7]["long_name"],
            address_components=json_address_input["address_components"],
            formatted_address=address_input["formatted_address"],
        )
        self.location = baker.make(Location, address=self.address, point=Point(self.point))

    def _get_address_inputs(
        self,
        street_number_override: Optional[str] = None,
        delete_street_number: bool = False,
        include_point_of_interest: bool = False,
        delete_components: bool = False,
    ) -> Tuple[Dict[str, str], Dict[str, Union[str, List[Dict[str, Any]]]]]:
        """Returns address input in two formats. JSON, for use in the mutation, and a dictionary for test assertions."""
        address_input: Dict[str, Union[str, List[Dict[str, Any]]]] = {
            "address_components": [
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
            "formatted_address": "106 West 1st Street, Los Angeles, CA 90012, USA",
        }

        if isinstance(address_input["address_components"], list):
            if street_number_override:
                address_input["address_components"][0]["long_name"] = street_number_override

            if delete_street_number:
                address_input["address_components"].pop(0)

            if include_point_of_interest:
                address_input["address_components"].append(
                    {
                        "long_name": "An Interesting Point (Component)",
                        "short_name": "An Interesting Point (Component)",
                        "types": ["point_of_interest"],
                    },
                )

            if delete_components:
                address_input["address_components"] = []

        json_address_input: Dict[str, str] = {"formatted_address": str(address_input["formatted_address"])}
        json_address_input["address_components"] = json.dumps(address_input["address_components"])

        return json_address_input, address_input

    @parametrize(
        (
            "street_number",
            "expected_address_count",
            "expected_location_count",
            "include_standalone_point_of_interest",
            "include_component_point_of_interest",
        ),
        [
            ("106", 1, 1, False, False),  # No new address or location
            ("104", 2, 2, False, False),  # New street -> new address -> new location
            ("106", 2, 2, False, True),  # POI in address_components -> new address -> new location
            # Standalone POI -> new location. No new address because POI not in address_components.
            ("106", 1, 2, True, False),
            ("106", 2, 2, True, True),  # POI in address_components -> new address -> new location
        ],
    )
    def test_get_or_create_location(
        self,
        street_number: str,
        expected_address_count: int,
        expected_location_count: int,
        include_standalone_point_of_interest: bool,
        include_component_point_of_interest: bool,
    ) -> None:
        self.assertEqual(1, Address.objects.count())
        self.assertEqual(1, Location.objects.count())
        json_address_input: Dict[str, str]
        address_input: Dict[str, Union[str, List[Dict[str, Any]]]]
        json_address_input, address_input = self._get_address_inputs(
            street_number_override=street_number,
            include_point_of_interest=include_component_point_of_interest,
        )

        location_data = {
            "address": json_address_input,
            "point": Point(self.point),
            "point_of_interest": (
                "An Interesting Point (Standalone)" if include_standalone_point_of_interest else None
            ),
        }
        location = Location.get_or_create_location(location_data)

        expected_point_of_interest = None
        if include_component_point_of_interest:
            expected_point_of_interest = "An Interesting Point (Component)"
        if include_standalone_point_of_interest:
            expected_point_of_interest = "An Interesting Point (Standalone)"

        assert isinstance(address_input["address_components"], list)
        expected_street = f"{address_input['address_components'][0]['long_name']} {address_input['address_components'][1]['long_name']}"
        expected_city = address_input["address_components"][3]["long_name"]
        expected_state = address_input["address_components"][5]["short_name"]
        expected_zip_code = address_input["address_components"][7]["long_name"]
        expected_formatted_address = address_input["formatted_address"]
        expected_address_components = json_address_input["address_components"]

        self.assertEqual(expected_address_count, Address.objects.count())
        self.assertEqual(expected_location_count, Location.objects.count())

        assert location.address
        assert location.point
        self.assertEqual(location.address.street, expected_street)
        self.assertEqual(location.address.city, expected_city)
        self.assertEqual(location.address.state, expected_state)
        self.assertEqual(location.address.zip_code, expected_zip_code)
        self.assertEqual(location.address.formatted_address, expected_formatted_address)
        self.assertEqual(location.address.address_components, expected_address_components)
        self.assertEqual(location.point.coords, self.point)
        self.assertEqual(location.point_of_interest, expected_point_of_interest)
