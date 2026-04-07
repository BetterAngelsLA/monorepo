import json
from typing import Any, Dict, List, Optional, Tuple, Union

from common.enums import AttachmentType
from common.models import Address, Attachment, Location, PhoneNumber
from common.tests.utils import build_address_inputs
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize


class LocationModelTestCase(ParametrizedTestCase, TestCase):
    def setUp(self) -> None:
        self.point = (-118.24372, 34.05217)
        self._setup_location()

    def _setup_location(self) -> None:
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
        )
        self.location = baker.make(Location, address=self.address, point=Point(self.point))

    def _get_address_inputs(
        self,
        street_number_override: Optional[str] = None,
        delete_street_number: bool = False,
        include_point_of_interest: bool = False,
        delete_components: bool = False,
    ) -> Tuple[Dict[str, str], Dict[str, Union[str, List[Dict[str, Any]]]]]:
        """Returns address input in two formats (snake_case keys for model-level tests)."""
        return build_address_inputs(
            camel_case=False,
            street_number_override=street_number_override,
            delete_street_number=delete_street_number,
            include_point_of_interest=include_point_of_interest,
            delete_components=delete_components,
        )

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
            "include_standalone_point_of_interest",
            "include_component_point_of_interest",
        ),
        [
            # get_or_create_location deduplicates on (point, address, poi).
            # Same point + same address + same POI → reuses existing Location.
            # Different address → new Address row and new Location row.
            ("106", 1, False, False),  # Same address, same point, no POI → reuse
            ("104", 2, False, False),  # Different address → new Location
            ("106", 1, False, True),  # POI from components → new Location (different POI)
            ("106", 1, True, False),  # Standalone POI → new Location (different POI)
            ("106", 1, True, True),  # Both POIs — standalone wins → new Location
        ],
    )
    def test_get_or_create_location(
        self,
        street_number: str,
        expected_address_count: int,
        include_standalone_point_of_interest: bool,
        include_component_point_of_interest: bool,
    ) -> None:
        initial_address_count = Address.objects.count()
        initial_location_count = Location.objects.count()
        json_address_input: Dict[str, str]
        address_input: Dict[str, Union[str, List[Dict[str, Any]]]]
        json_address_input, address_input = self._get_address_inputs(
            street_number_override=street_number,
            include_point_of_interest=include_component_point_of_interest,
        )

        standalone_poi = "An Interesting Point (Standalone)" if include_standalone_point_of_interest else None
        location_data = {
            "address": json_address_input,
            "point": Point(self.point),
            "point_of_interest": standalone_poi,
        }
        location = Location.get_or_create_location(location_data)

        self.assertEqual(Address.objects.count(), initial_address_count + expected_address_count - 1)

        # First parametrize case: same (point, address, no POI) as setUp → reuses row.
        # Other cases involve different address or non-null POI → new row.
        if (
            street_number == "106"
            and not include_standalone_point_of_interest
            and not include_component_point_of_interest
        ):
            self.assertEqual(Location.objects.count(), initial_location_count)  # reused
        else:
            self.assertEqual(Location.objects.count(), initial_location_count + 1)  # new row

        assert location.address
        assert location.point
        self.assertEqual(location.point.coords, self.point)

        if include_standalone_point_of_interest:
            self.assertEqual(location.point_of_interest, "An Interesting Point (Standalone)")
        elif include_component_point_of_interest:
            self.assertIsNotNone(location.point_of_interest)
        else:
            self.assertIsNone(location.point_of_interest)

    def test_get_or_create_location_missing_components(self) -> None:
        """When components are empty but formatted_address matches an existing
        row, the existing Address is reused (via the unique constraint on
        formatted_address)."""
        address_count = Address.objects.count()
        json_address_input, _ = self._get_address_inputs(delete_components=True)

        location_data = {
            "address": json_address_input,
            "point": Point(self.point),
            "point_of_interest": None,
        }
        location = Location.get_or_create_location(location_data)

        # No new Address created — existing row matched by formatted_address
        self.assertEqual(Address.objects.count(), address_count)
        assert location.address
        self.assertEqual(location.address.pk, self.address.pk)

    @parametrize(
        ("missing_component_index"),
        [
            (0,),  # Remove street number
            (1,),  # Remove route
        ],
    )
    def test_get_or_create_location_partial_street(self, missing_component_index: int) -> None:
        """Partial components with a *new* formatted_address create a new Address
        with the expected partial street value."""
        address_count = Address.objects.count()
        _, address_input = self._get_address_inputs()
        assert isinstance(address_input["address_components"], list)

        expected_street = "West 1st Street" if missing_component_index == 0 else None
        address_input["address_components"].pop(missing_component_index)
        address_input["address_components"] = json.dumps(address_input["address_components"])
        # Use a distinct formatted_address so it doesn't match the setUp row
        address_input["formatted_address"] = "Partial Street Test Address"
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

    def test_get_or_create_location_gps_rounding(self) -> None:
        """get_or_create_location should round GPS coordinates to GPS_PRECISION decimal places."""
        json_address_input, _ = self._get_address_inputs()

        location_data = {
            "address": json_address_input,
            "point": Point(-118.2437207, 34.0521723),  # rounds to (-118.24372, 34.05217)
            "point_of_interest": None,
        }

        location = Location.get_or_create_location(location_data)
        self.assertEqual(location.point.x, -118.24372)
        self.assertEqual(location.point.y, 34.05217)

    def test_get_or_create_location_dedup(self) -> None:
        """Identical (point, address, poi) should return the same Location row."""
        json_address_input, _ = self._get_address_inputs()
        location_data = {
            "address": json_address_input,
            "point": Point(self.point),
            "point_of_interest": None,
        }
        loc1 = Location.get_or_create_location(location_data)
        loc2 = Location.get_or_create_location(location_data)
        self.assertEqual(loc1.pk, loc2.pk)

    def test_get_or_create_location_different_poi_creates_new(self) -> None:
        """Same point + address but different POI should create a new Location."""
        json_address_input, _ = self._get_address_inputs()
        loc1 = Location.get_or_create_location(
            {
                "address": json_address_input,
                "point": Point(self.point),
                "point_of_interest": None,
            }
        )
        loc2 = Location.get_or_create_location(
            {
                "address": json_address_input,
                "point": Point(self.point),
                "point_of_interest": "New POI",
            }
        )
        self.assertNotEqual(loc1.pk, loc2.pk)


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


@override_settings(STORAGES={"default": {"BACKEND": "django.core.files.storage.InMemoryStorage"}})
class AttachmentTestCase(TestCase):
    def test_save(self) -> None:
        file_content = b"Test file content"
        file_name = "test%20file%20name"
        file = SimpleUploadedFile(name=file_name, content=file_content)
        content_type = ContentType.objects.get_for_model(Address)
        attachment = Attachment.objects.create(content_type=content_type, object_id=1, file=file)

        self.assertEqual(attachment.original_filename, "test file name.txt")

    def test_save_direct_upload(self) -> None:
        file_name = "test%20file%20name.jpg"
        file = SimpleUploadedFile(name=file_name, content=b"irrelevant")

        content_type = ContentType.objects.get_for_model(Address)

        attachment = Attachment(
            content_type=content_type,
            object_id=1,
            file=file,
            mime_type="image/jpeg",
        )

        attachment.save(direct_upload=True)

        self.assertEqual(attachment.mime_type, "image/jpeg")
        self.assertEqual(attachment.original_filename, "test file name.jpg")
        self.assertEqual(attachment.attachment_type, AttachmentType.IMAGE)

    def test_save_direct_upload_requires_mime_type(self) -> None:
        file = SimpleUploadedFile(name="file.jpg", content=b"irrelevant")
        content_type = ContentType.objects.get_for_model(Address)

        attachment = Attachment(
            content_type=content_type,
            object_id=1,
            file=file,
        )

        with self.assertRaises(ValueError):
            attachment.save(direct_upload=True)
