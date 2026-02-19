import json
from typing import Any, Dict, List, Optional, Tuple, Union

from common.models import Address, Attachment, Location, PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize


class LocationModelTestCase(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        self.point = (-118.24372, 34.05217)
        self._setup_location()

    def _setup_location(self) -> None:
        # Force login to create a location
        json_address_input, address_input = self._get_address_inputs()
        assert isinstance(address_input["address_components"], list)
        self.address = baker.make(
            Address,
            street=(
                f"{address_input['address_components'][0]['long_name']} "
                f"{address_input['address_components'][1]['long_name']}"
            ),
            city=address_input["address_components"][3]["long_name"],
            state=address_input["address_components"][5]["short_name"],
            zip_code=address_input["address_components"][7]["long_name"],
            formatted_address=address_input["formatted_address"],
            address_components=json_address_input["address_components"],
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

    def test_parse_address_components(self) -> None:
        json_address_input, _ = self._get_address_inputs(include_point_of_interest=True)
        parsed_address_components = Location.parse_address_components(json_address_input["address_components"])
        expected_parsed_address_components = {
            "street_number": "106",
            "route": "West 1st Street",
            "locality": "Los Angeles",
            "administrative_area_level_1": "CA",
            "country": "United States",
            "postal_code": "90012",
            "point_of_interest": "An Interesting Point (Component)",
        }

        self.assertEqual(parsed_address_components, expected_parsed_address_components)

    def test_parse_address_components_v1_format(self) -> None:
        """parse_address_components should also accept Google Places API v1 format (longText/shortText)."""
        v1_components = json.dumps(
            [
                {"longText": "106", "shortText": "106", "types": ["street_number"]},
                {"longText": "West 1st Street", "shortText": "W 1st St", "types": ["route"]},
                {
                    "longText": "Downtown Los Angeles",
                    "shortText": "Downtown Los Angeles",
                    "types": ["neighborhood", "political"],
                },
                {"longText": "Los Angeles", "shortText": "Los Angeles", "types": ["locality", "political"]},
                {
                    "longText": "Los Angeles County",
                    "shortText": "Los Angeles County",
                    "types": ["administrative_area_level_2", "political"],
                },
                {"longText": "California", "shortText": "CA", "types": ["administrative_area_level_1", "political"]},
                {"longText": "United States", "shortText": "US", "types": ["country", "political"]},
                {"longText": "90012", "shortText": "90012", "types": ["postal_code"]},
                {
                    "longText": "An Interesting Point (Component)",
                    "shortText": "An Interesting Point (Component)",
                    "types": ["point_of_interest"],
                },
            ]
        )
        parsed = Location.parse_address_components(v1_components)
        expected = {
            "street_number": "106",
            "route": "West 1st Street",
            "locality": "Los Angeles",
            "administrative_area_level_1": "CA",
            "country": "United States",
            "postal_code": "90012",
            "point_of_interest": "An Interesting Point (Component)",
        }
        self.assertEqual(parsed, expected)

    def test_parse_address_components_mixed_formats(self) -> None:
        """parse_address_components should handle a mix of v1 and legacy components."""
        mixed_components = json.dumps(
            [
                {"longText": "106", "shortText": "106", "types": ["street_number"]},
                {"long_name": "West 1st Street", "short_name": "W 1st St", "types": ["route"]},
                {"longText": "Los Angeles", "shortText": "Los Angeles", "types": ["locality", "political"]},
                {"long_name": "California", "short_name": "CA", "types": ["administrative_area_level_1"]},
                {"longText": "90012", "shortText": "90012", "types": ["postal_code"]},
            ]
        )
        parsed = Location.parse_address_components(mixed_components)
        self.assertEqual(parsed["street_number"], "106")
        self.assertEqual(parsed["route"], "West 1st Street")
        self.assertEqual(parsed["locality"], "Los Angeles")
        self.assertEqual(parsed["administrative_area_level_1"], "CA")
        self.assertEqual(parsed["postal_code"], "90012")

    def test_parse_address_components_missing_types(self) -> None:
        """Components with no 'types' key or empty types should be safely ignored."""
        components = json.dumps(
            [
                {"longText": "106", "shortText": "106", "types": ["street_number"]},
                {"longText": "West 1st Street", "shortText": "W 1st St"},  # no types key
                {"longText": "Ghost", "shortText": "Ghost", "types": []},  # empty types
                {"longText": "Los Angeles", "shortText": "Los Angeles", "types": ["locality"]},
                {"longText": "CA", "shortText": "CA", "types": ["administrative_area_level_1"]},
                {"longText": "90012", "shortText": "90012", "types": ["postal_code"]},
            ]
        )
        parsed = Location.parse_address_components(components)
        self.assertEqual(parsed["street_number"], "106")
        self.assertIsNone(parsed["route"])  # skipped — no types key
        self.assertEqual(parsed["locality"], "Los Angeles")
        self.assertEqual(parsed["administrative_area_level_1"], "CA")
        self.assertEqual(parsed["postal_code"], "90012")

    def test_get_point_of_interest_v1_format(self) -> None:
        """get_point_of_interest should accept v1 format (longText/shortText)."""
        address_data = {
            "address_components": json.dumps(
                [
                    {"longText": "Some Place", "shortText": "Some Place", "types": ["point_of_interest"]},
                ]
            ),
        }
        self.assertEqual(Location.get_point_of_interest(address_data), "Some Place")

    def test_get_or_create_address_case_insensitive_dedup(self) -> None:
        """Addresses differing only by case should resolve to the same Address row."""
        components_lower = json.dumps(
            [
                {"long_name": "100", "short_name": "100", "types": ["street_number"]},
                {"long_name": "Main Street", "short_name": "Main St", "types": ["route"]},
                {"long_name": "Springfield", "short_name": "Springfield", "types": ["locality"]},
                {"long_name": "IL", "short_name": "IL", "types": ["administrative_area_level_1"]},
                {"long_name": "62701", "short_name": "62701", "types": ["postal_code"]},
            ]
        )
        components_upper = json.dumps(
            [
                {"long_name": "100", "short_name": "100", "types": ["street_number"]},
                {"long_name": "MAIN STREET", "short_name": "MAIN ST", "types": ["route"]},
                {"long_name": "SPRINGFIELD", "short_name": "SPRINGFIELD", "types": ["locality"]},
                {"long_name": "IL", "short_name": "IL", "types": ["administrative_area_level_1"]},
                {"long_name": "62701", "short_name": "62701", "types": ["postal_code"]},
            ]
        )
        addr1 = Location.get_or_create_address(
            {"address_components": components_lower, "formatted_address": "100 Main Street"}
        )
        addr2 = Location.get_or_create_address(
            {"address_components": components_upper, "formatted_address": "100 MAIN STREET"}
        )
        assert addr1 is not None
        assert addr2 is not None
        self.assertEqual(addr1.pk, addr2.pk)

    def test_get_or_create_address_whitespace_normalization(self) -> None:
        """Leading, trailing, and extra internal whitespace should not create duplicates."""
        canonical = json.dumps(
            [
                {"long_name": "100", "short_name": "100", "types": ["street_number"]},
                {"long_name": "Main Street", "short_name": "Main St", "types": ["route"]},
                {"long_name": "Springfield", "short_name": "Springfield", "types": ["locality"]},
                {"long_name": "IL", "short_name": "IL", "types": ["administrative_area_level_1"]},
                {"long_name": "62701", "short_name": "62701", "types": ["postal_code"]},
            ]
        )
        messy = json.dumps(
            [
                {"long_name": "100", "short_name": "100", "types": ["street_number"]},
                {"long_name": "  Main   Street  ", "short_name": "Main St", "types": ["route"]},
                {"long_name": " Springfield ", "short_name": "Springfield", "types": ["locality"]},
                {"long_name": " IL ", "short_name": "IL", "types": ["administrative_area_level_1"]},
                {"long_name": " 62701 ", "short_name": "62701", "types": ["postal_code"]},
            ]
        )
        addr1 = Location.get_or_create_address(
            {"address_components": canonical, "formatted_address": "100 Main Street"}
        )
        addr2 = Location.get_or_create_address({"address_components": messy, "formatted_address": "100 Main Street"})
        assert addr1 is not None
        assert addr2 is not None
        self.assertEqual(addr1.pk, addr2.pk)

    def test_get_or_create_address_formatted_address_variants(self) -> None:
        """Both formattedAddress (camelCase) and formatted_address (snake_case) keys work and dedupe."""
        components = json.dumps(
            [
                {"long_name": "200", "short_name": "200", "types": ["street_number"]},
                {"long_name": "Oak Ave", "short_name": "Oak Ave", "types": ["route"]},
                {"long_name": "Shelbyville", "short_name": "Shelbyville", "types": ["locality"]},
                {"long_name": "IL", "short_name": "IL", "types": ["administrative_area_level_1"]},
                {"long_name": "62565", "short_name": "62565", "types": ["postal_code"]},
            ]
        )
        # camelCase key
        addr1 = Location.get_or_create_address(
            {"address_components": components, "formattedAddress": "200 Oak Ave, Shelbyville, IL"}
        )
        assert addr1 is not None
        self.assertEqual(addr1.formatted_address, "200 Oak Ave, Shelbyville, IL")

        # snake_case key with same components should return same address
        addr2 = Location.get_or_create_address(
            {"address_components": components, "formatted_address": "200 Oak Ave, Shelbyville, IL"}
        )
        assert addr2 is not None
        self.assertEqual(addr1.pk, addr2.pk)

    @parametrize(
        (
            "street_number",
            "expected_address_count",
            "expected_location_count",
            "include_standalone_point_of_interest",
            "include_component_point_of_interest",
        ),
        [
            # All test cases use same point -> same Location (unique constraint).
            # Address/POI are updated on existing Location when provided.
            ("106", 1, 1, False, False),  # Same address, same location (no change)
            ("104", 2, 1, False, False),  # New address created, but location reused (updated)
            ("106", 1, 1, False, True),  # Same address, POI updated on existing location
            ("106", 1, 1, True, False),  # Same address, standalone POI updated
            ("106", 1, 1, True, True),  # Standalone POI wins, updated on existing location
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
        self.assertEqual(Address.objects.count(), 1)
        self.assertEqual(Location.objects.count(), 1)
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
        expected_street = (
            f"{address_input['address_components'][0]['long_name']} "
            f"{address_input['address_components'][1]['long_name']}"
        )
        expected_city = address_input["address_components"][3]["long_name"]
        expected_state = address_input["address_components"][5]["short_name"]
        expected_zip_code = address_input["address_components"][7]["long_name"]

        self.assertEqual(Address.objects.count(), expected_address_count)
        self.assertEqual(Location.objects.count(), expected_location_count)

        assert location.address
        assert location.point
        self.assertEqual(location.address.street, expected_street)
        self.assertEqual(location.address.city, expected_city)
        self.assertEqual(location.address.state, expected_state)
        self.assertEqual(location.address.zip_code, expected_zip_code)
        self.assertEqual(location.point.coords, self.point)
        self.assertEqual(location.point_of_interest, expected_point_of_interest)

    def test_get_or_create_location_missing_components(self) -> None:
        address_count = Address.objects.count()
        json_address_input, _ = self._get_address_inputs(delete_components=True)

        location_data = {
            "address": json_address_input,
            "point": Point(self.point),
            "point_of_interest": None,
        }
        location = Location.get_or_create_location(location_data)

        self.assertEqual(Address.objects.count(), address_count + 1)
        assert location.address
        self.assertIsNone(location.address.street)
        self.assertIsNone(location.address.city)
        self.assertIsNone(location.address.state)
        self.assertIsNone(location.address.zip_code)

    @parametrize(
        ("missing_component_index"),
        [
            (0,),  # Remove street number
            (1,),  # Remove route
        ],
    )
    def test_get_or_create_location_partial_street(self, missing_component_index: int) -> None:
        address_count = Address.objects.count()
        _, address_input = self._get_address_inputs()
        assert isinstance(address_input["address_components"], list)

        expected_street = "West 1st Street" if missing_component_index == 0 else None
        address_input["address_components"].pop(missing_component_index)
        address_input["address_components"] = json.dumps(address_input["address_components"])
        location_data = {
            "address": address_input,
            "point": Point(self.point),
            "point_of_interest": None,
        }
        location = Location.get_or_create_location(location_data)

        assert location.address
        self.assertEqual(Address.objects.count(), address_count + 1)
        self.assertEqual(location.address.street, expected_street)

    def test_round_point_clamps_gps_jitter(self) -> None:
        """_round_point should round coordinates to GPS_PRECISION (5) decimal places."""
        raw = Point(-118.2437207, 34.0521723)
        rounded = Location._round_point(raw)
        self.assertEqual(rounded.x, -118.24372)
        self.assertEqual(rounded.y, 34.05217)
        self.assertEqual(rounded.srid, raw.srid)

    def test_get_or_create_location_gps_dedup(self) -> None:
        """Nearby GPS points that round to the same 5dp value should share one Location."""
        json_address_input, _ = self._get_address_inputs()

        loc1_data = {
            "address": json_address_input,
            "point": Point(-118.2437207, 34.0521723),  # rounds to (-118.24372, 34.05217)
            "point_of_interest": None,
        }
        loc2_data = {
            "address": json_address_input,
            "point": Point(-118.2437198, 34.0521749),  # same after rounding
            "point_of_interest": None,
        }

        loc1 = Location.get_or_create_location(loc1_data)
        loc2 = Location.get_or_create_location(loc2_data)
        self.assertEqual(loc1.pk, loc2.pk)
        self.assertEqual(Location.objects.filter(point=loc1.point).count(), 1)


class PhoneNumberTestCase(TestCase):
    def test_save(self) -> None:
        content_type = ContentType.objects.get_for_model(Address)
        phone_number_1 = PhoneNumber.objects.create(
            content_type=content_type, object_id=1, number="2125551212", is_primary=True
        )
        self.assertTrue(phone_number_1.is_primary)

        phone_number_2 = PhoneNumber.objects.create(
            content_type=content_type, object_id=1, number="2125551213", is_primary=True
        )
        phone_number_1.refresh_from_db()
        self.assertFalse(phone_number_1.is_primary)
        self.assertTrue(phone_number_2.is_primary)


class AttachmentTestCase(TestCase):
    def test_save(self) -> None:
        file_content = b"Test file content"
        file_name = "test%20file%20name"
        file = SimpleUploadedFile(name=file_name, content=file_content)
        content_type = ContentType.objects.get_for_model(Address)
        attachment = Attachment.objects.create(content_type=content_type, object_id=1, file=file)

        self.assertEqual(attachment.original_filename, "test file name.txt")
