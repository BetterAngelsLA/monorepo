import datetime
from typing import Any
from unittest.mock import patch

from common.tests.utils import GraphQLBaseTestCase
from django.contrib.auth.models import Permission
from django.db import connection
from django.test.utils import CaptureQueriesContext
from places import Places
from unittest_parametrize import parametrize

from shelters.enums import (
    AccessibilityChoices,
    DayOfWeekChoices,
    ParkingChoices,
    PetChoices,
    ScheduleTypeChoices,
    ShelterChoices,
    ShelterProgramChoices,
    StatusChoices,
    StorageChoices,
)
from shelters.models import (
    SPA,
    Accessibility,
    City,
    Parking,
    Pet,
    Service,
    ServiceCategory,
    Shelter,
    ShelterProgram,
    ShelterType,
    Storage,
)
from shelters.models.schedule import Schedule
from shelters.tests.baker_recipes import shelter_recipe


class PublicShelterFilterQueryTestCase(GraphQLBaseTestCase):
    def setUp(self) -> None:
        super().setUp()

    def get_shelters_query(self, fields: str) -> str:
        return f"""
            query ($filters: PublicShelterFilter, $ordering: [ShelterOrder!]) {{
                shelters (filters: $filters, ordering: $ordering) {{
                    totalCount
                    results {{{fields}}}
                }}
            }}
        """

    def test_shelter_location_filter(self) -> None:
        reference_point = {
            "latitude": 34,
            "longitude": -118,
        }

        search_range_in_miles = 20
        _, s2, s3 = [
            Shelter.objects.create(
                location=Places(
                    place=f"place {i}",
                    # Each subsequent shelter is ~9 miles further from the reference point.
                    latitude=f"{reference_point['latitude']}.{i}",
                    longitude=f"{reference_point['longitude']}.{i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(3, 0, -1)
        ]

        filters: dict[str, Any] = {}
        filters["geolocation"] = {
            "latitude": reference_point["latitude"],
            "longitude": reference_point["longitude"],
            "rangeInMiles": search_range_in_miles,
        }

        query = self.get_shelters_query("id distanceInMiles")

        with CaptureQueriesContext(connection) as context:
            response = self.execute_graphql(query, variables={"filters": filters})
            # PostGIS spatial_ref_sys may be cached or not, so accept either 2 or 3 queries
            self.assertIn(len(context.captured_queries), [2, 3])

        results = response["data"]["shelters"]["results"]

        result_shelter_ids = [r["id"] for r in results]
        # s1 is ~27 miles away from the reference point, so it was not included in the response payload
        self.assertEqual(result_shelter_ids, [str(s3.pk), str(s2.pk)])

    def test_shelter_map_bounds_filter(self) -> None:
        """Test map bounds filter for querying shelters within a defined area.

        1. Create 5 shelters at coordinates:
           - (-4, -4)
           - (-2, -2)
           - (0, 0)
           - (2, 2)
           - (4, 4)

        2. Define the map boundary:
           - Construct a square boundary box defined by the following latitude and longitude values:
             (-3, 3, 3, -3)
           - Note that the boundary box's values correspond to: west, north, east, south

        3. Execute query and verify results:
           - Query shelters with the map bounds filter.
           - Confirm that only the three shelters within the polygon are returned.

         4                          x
         3     ┌─────────────────┐
         2     │              x  │
         1     │                 │
         0     │        x        │
        -1     │                 │
        -2     │  x              │
        -3     └─────────────────┘
        -4  x
           -4 -3 -2 -1  0  1  2  3  4

        """

        reference_point = {
            "latitude": 4,
            "longitude": 4,
        }

        _, s2, s3, s4, _ = [
            Shelter.objects.create(
                location=Places(
                    place=f"place {i}",
                    # Each subsequent shelter is two degrees further from the reference point
                    latitude=f"{reference_point['latitude'] - i}",
                    longitude=f"{reference_point['longitude'] - i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(8, -2, -2)
        ]

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {
            "mapBounds": {
                "westLng": -3,
                "northLat": 3,
                "eastLng": 3,
                "southLat": -3,
            }
        }

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        result_ids = {s["id"] for s in response["data"]["shelters"]["results"]}
        expected_ids = {str(s.id) for s in [s2, s3, s4]}

        self.assertEqual(len(result_ids), 3)
        self.assertEqual(result_ids, expected_ids)

    def test_shelter_map_bounds_filter_regression_asymmetric_bounds(self) -> None:
        inside = Shelter.objects.create(
            location=Places(
                place="inside",
                latitude=34.05,
                longitude=-118.25,
            ),
            status=StatusChoices.APPROVED,
        )
        outside = Shelter.objects.create(
            location=Places(
                place="outside",
                latitude=36.0,
                longitude=-118.25,
            ),
            status=StatusChoices.APPROVED,
        )
        north_boundary = Shelter.objects.create(
            location=Places(
                place="north-boundary",
                latitude=35.0,
                longitude=-118.25,
            ),
            status=StatusChoices.APPROVED,
        )

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {
            "mapBounds": {
                "westLng": -119,
                "northLat": 35,
                "eastLng": -117,
                "southLat": 33,
            }
        }

        response = self.execute_graphql(query, variables={"filters": filters})

        result_ids = {s["id"] for s in response["data"]["shelters"]["results"]}
        self.assertIn(str(inside.id), result_ids)
        self.assertNotIn(str(outside.id), result_ids)
        self.assertNotIn(str(north_boundary.id), result_ids)

    def test_shelter_combined_filters(self) -> None:
        reference_point = {
            "latitude": 4,
            "longitude": 4,
        }

        _, s2, s3, s4, _ = [
            Shelter.objects.create(
                location=Places(
                    place=f"place {i}",
                    # Each subsequent shelter is two degrees further from the reference point
                    latitude=f"{reference_point['latitude'] - i}",
                    longitude=f"{reference_point['longitude'] - i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(8, -2, -2)
        ]

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {
            "mapBounds": {
                "westLng": -3,
                "northLat": 3,
                "eastLng": 3,
                "southLat": -3,
            },
            "geolocation": {
                "latitude": reference_point["latitude"],
                "longitude": reference_point["longitude"],
            },
        }

        with CaptureQueriesContext(connection) as context:
            response = self.execute_graphql(query, variables={"filters": filters})
        # PostGIS spatial_ref_sys may be cached or not.
        self.assertIn(len(context.captured_queries), [2, 3])

        result_ids = [s["id"] for s in response["data"]["shelters"]["results"]]
        expected_ids = [str(s.id) for s in [s4, s3, s2]]

        self.assertEqual(len(result_ids), 3)
        self.assertEqual(result_ids, expected_ids)

    def test_shelter_map_bounds_filter_validation(self) -> None:
        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {
            "mapBounds": {
                "westLng": -181,
                "northLat": 91,
                "eastLng": 3,
                "southLat": -3,
            },
        }

        response = self.execute_graphql(query, variables={"filters": filters})

        self.assertIsNone(response["data"])
        self.assertEqual(len(response["errors"]), 2)

        error_messages = [e["message"] for e in response["errors"]]
        expected_error_messages = [
            "Longitude value must be between -180.0 and 180.0",
            "Latitude value must be between -90.0 and 90.0",
        ]

        for e in expected_error_messages:
            self.assertTrue(
                any(e in msg for msg in error_messages), f"Expected to find {e!r} in one of {error_messages!r}"
            )

    def test_shelter_is_access_center_filter(self) -> None:
        access_center, _ = ShelterType.objects.get_or_create(name=ShelterChoices.ACCESS_CENTER)
        shelters = shelter_recipe.make(status=StatusChoices.APPROVED, shelter_types=[access_center], _quantity=2)

        query = self.get_shelters_query("id")
        filters: dict[str, Any] = {"isAccessCenter": True}

        expected_query_count = 2

        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        shelter_ids = {str(shelter.id) for shelter in shelters}
        result_ids = {s["id"] for s in response["data"]["shelters"]["results"]}
        self.assertEqual(shelter_ids, result_ids)

    @parametrize(
        "days, include_null, expected_result_count",
        [
            (3, True, 2),
            (3, False, 1),
            (7, True, 1),
            (7, False, 0),
        ],
    )
    def test_shelter_max_stay_filter(self, days: int, include_null: bool, expected_result_count: int) -> None:
        shelter_recipe.make(max_stay=None, status=StatusChoices.APPROVED)
        shelter_recipe.make(max_stay=0, status=StatusChoices.APPROVED)
        shelter_recipe.make(max_stay=3, status=StatusChoices.APPROVED)
        shelter_recipe.make(max_stay=7, status=StatusChoices.PENDING)

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {"maxStay": {"days": days, "includeNull": include_null}}

        response = self.execute_graphql(query, variables={"filters": filters})

        self.assertEqual(response["data"]["shelters"]["totalCount"], expected_result_count)

    @parametrize(
        "property_filters, expected_result_count",
        [
            ({"pets": [PetChoices.CATS.name]}, 2),
            ({"pets": [PetChoices.SERVICE_ANIMALS.name]}, 1),
            ({"pets": [PetChoices.CATS.name, PetChoices.SERVICE_ANIMALS.name]}, 2),
            ({"pets": [PetChoices.CATS.name], "parking": [ParkingChoices.BICYCLE.name]}, 1),
            ({"pets": [PetChoices.CATS.name], "parking": [ParkingChoices.RV.name]}, 0),
            ({"pets": [PetChoices.DOGS_UNDER_25_LBS.name], "parking": [ParkingChoices.RV.name]}, 1),
        ],
    )
    def test_shelter_property_filter(self, property_filters: dict[str, str], expected_result_count: int) -> None:
        shelter_recipe.make(
            parking=[],
            pets=[
                Pet.objects.get_or_create(name=PetChoices.CATS)[0],
                Pet.objects.get_or_create(name=PetChoices.SERVICE_ANIMALS)[0],
            ],
            status=StatusChoices.APPROVED,
        )
        shelter_recipe.make(
            parking=[Parking.objects.get_or_create(name=ParkingChoices.BICYCLE)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.CATS)[0]],
            status=StatusChoices.APPROVED,
        )
        shelter_recipe.make(
            parking=[Parking.objects.get_or_create(name=ParkingChoices.RV)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.DOGS_UNDER_25_LBS)[0]],
            status=StatusChoices.APPROVED,
        )

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {}
        filters["properties"] = property_filters

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]

        self.assertEqual(len(results), expected_result_count)

    @parametrize(
        "property_filters, expected_result_count",
        [
            # Without includeNull, only shelters WITH the specified property match
            ({"pets": [PetChoices.CATS.name]}, 1),
            # With includeNull, shelters with no pets also match
            ({"pets": [PetChoices.CATS.name], "petsIncludeNull": True}, 2),
            # Only includeNull — only shelters with no pets
            ({"petsIncludeNull": True}, 1),
            # includeNull=False has no effect (same as not specifying)
            ({"pets": [PetChoices.CATS.name], "petsIncludeNull": False}, 1),
            # includeNull on parking: CATS pets AND null parking → 0 shelters
            # (A has CATS but RV parking, C has null parking but no CATS)
            ({"pets": [PetChoices.CATS.name], "parkingIncludeNull": True}, 0),
            # CATS pets AND (BICYCLE parking OR null parking)
            # A: CATS+RV (no), B: DOGS+BICYCLE (no CATS), C: null (no CATS) → 0
            (
                {
                    "pets": [PetChoices.CATS.name],
                    "parking": [ParkingChoices.BICYCLE.name],
                    "parkingIncludeNull": True,
                },
                0,
            ),
            # DOGS_UNDER_25 pets AND (BICYCLE parking OR null parking)
            # B: DOGS_UNDER_25+BICYCLE (yes), C: null parking (no DOGS) → 1
            (
                {
                    "pets": [PetChoices.DOGS_UNDER_25_LBS.name],
                    "parking": [ParkingChoices.BICYCLE.name],
                    "parkingIncludeNull": True,
                },
                1,
            ),
        ],
    )
    def test_shelter_property_filter_include_null(
        self, property_filters: dict[str, Any], expected_result_count: int
    ) -> None:
        """Test that includeNull flags for property filters work correctly.

        Creates three shelters:
        - Shelter A: pets=[CATS], parking=[RV]
        - Shelter B: pets=[DOGS_UNDER_25_LBS], parking=[BICYCLE]
        - Shelter C: pets=[], parking=[] (no data for either property)
        """
        shelter_recipe.make(
            parking=[Parking.objects.get_or_create(name=ParkingChoices.RV)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.CATS)[0]],
            status=StatusChoices.APPROVED,
        )
        shelter_recipe.make(
            parking=[Parking.objects.get_or_create(name=ParkingChoices.BICYCLE)[0]],
            pets=[Pet.objects.get_or_create(name=PetChoices.DOGS_UNDER_25_LBS)[0]],
            status=StatusChoices.APPROVED,
        )
        shelter_recipe.make(
            parking=[],
            pets=[],
            status=StatusChoices.APPROVED,
        )

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {}
        filters["properties"] = property_filters

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]

        self.assertEqual(len(results), expected_result_count)

    def test_shelter_spa_filter(self) -> None:
        spa_one, _ = SPA.objects.get_or_create(short_name="1", defaults={"long_name": "1 - Antelope Valley"})

        shelters_in_spa = shelter_recipe.make(spa=spa_one, status=StatusChoices.APPROVED, _quantity=2)
        shelter_recipe.make(spa=None, status=StatusChoices.APPROVED, _quantity=2)

        query = self.get_shelters_query("id")

        filters: dict[str, Any] = {"spa": [str(spa_one.pk)]}

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]
        result_ids = {r["id"] for r in results}

        self.assertEqual(result_ids, {str(shelter.id) for shelter in shelters_in_spa})

    def test_shelter_open_now_for_filter(self) -> None:
        open_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        closed_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        fixed_utc_now = datetime.datetime(
            2026,
            1,
            5,
            20,
            0,
            tzinfo=datetime.timezone.utc,
        )

        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )
        Schedule.objects.create(
            shelter=closed_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(10, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_utc_now.astimezone(datetime.timezone(datetime.timedelta(hours=-8))),
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )

        results = response["data"]["shelters"]["results"]
        result_ids = {result["id"] for result in results}

        self.assertIn(str(open_shelter.pk), result_ids)
        self.assertNotIn(str(closed_shelter.pk), result_ids)

    def test_shelter_open_now_for_excludes_permanent_closed_exception(self) -> None:
        """A shelter with a permanent closed exception (no date bounds)
        for the current day should NOT appear in Open Now results."""
        shelter_with_exception = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_without_exception = shelter_recipe.make(status=StatusChoices.APPROVED)

        # Monday 12:00 noon PST
        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        # Both shelters have regular Monday operating hours 8am-6pm
        for shelter in (shelter_with_exception, shelter_without_exception):
            Schedule.objects.create(
                shelter=shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                start_time=datetime.time(8, 0),
                end_time=datetime.time(18, 0),
                is_exception=False,
            )

        # Permanent closed exception on Monday (no start_date/end_date)
        Schedule.objects.create(
            shelter=shelter_with_exception,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertNotIn(
            str(shelter_with_exception.pk),
            result_ids,
            "Shelter with a permanent closed exception should be excluded from Open Now",
        )
        self.assertIn(str(shelter_without_exception.pk), result_ids)

    def test_shelter_open_now_for_no_exceptions(self) -> None:
        """Regression: shelters open on Monday must not be excluded because of
        a *different-day* permanent closed exception on the same shelter.

        Django's ``exclude()`` over a multi-valued reverse FK can
        cross-match fields from different schedule rows, incorrectly
        excluding shelters that have no Monday exception at all.
        """
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        # Monday 12:00 noon PST — within 8am-6pm window
        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        # Regular operating hours for Monday
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        # Permanent closed exception for TUESDAY (different day, should NOT
        # affect Monday).  This triggers the exclude() cross-match bug.
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.TUESDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(
            str(shelter.pk),
            result_ids,
            "Shelter with regular hours and no exceptions must appear in Open Now",
        )

    def test_shelter_open_now_for_every_day_schedule(self) -> None:
        """Schedules with day=NULL mean 'every day' and must be matched
        by the Open Now filter regardless of the current weekday."""
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        # Monday 12:00 noon PST
        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        # Schedule with day=None (applies every day)
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(
            str(shelter.pk),
            result_ids,
            "Shelter with day=NULL (every-day) schedule must appear in Open Now",
        )

    def test_shelter_open_now_for_excludes_partial_day_exception(self) -> None:
        """A shelter with a partial-day exception covering the current time
        should NOT appear in Open Now results, but a shelter whose partial
        exception does NOT cover the current time should still appear."""
        shelter_during = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_outside = shelter_recipe.make(status=StatusChoices.APPROVED)

        # Monday 1:00 PM PST — within partial exception window for shelter_during
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        # Both shelters have regular Monday operating hours 8am-6pm
        for shelter in (shelter_during, shelter_outside):
            Schedule.objects.create(
                shelter=shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                start_time=datetime.time(8, 0),
                end_time=datetime.time(18, 0),
                is_exception=False,
            )

        # shelter_during: partial exception 12pm-2pm on Monday (covers 1 PM)
        Schedule.objects.create(
            shelter=shelter_during,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=True,
        )

        # shelter_outside: partial exception 3pm-4pm on Monday (does NOT cover 1 PM)
        Schedule.objects.create(
            shelter=shelter_outside,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(15, 0),
            end_time=datetime.time(16, 0),
            is_exception=True,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertNotIn(
            str(shelter_during.pk),
            result_ids,
            "Shelter with partial exception covering current time must be excluded",
        )
        self.assertIn(
            str(shelter_outside.pk),
            result_ids,
            "Shelter with partial exception NOT covering current time must appear",
        )

    def test_shelter_open_now_for_multiple_schedule_types(self) -> None:
        """openNowFor accepts a list of schedule types and returns shelters open in ANY of them (union)."""
        # Monday 1:00 PM PST
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        shelter_operating = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        shelter_intake_only = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_intake_only,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        shelter_meal_only = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_meal_only,
            schedule_type=ScheduleTypeChoices.MEAL_SERVICE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 30),
            end_time=datetime.time(13, 30),
            is_exception=False,
        )

        shelter_no_match = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_no_match,
            schedule_type=ScheduleTypeChoices.STAFF_AVAILABILITY,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING", "INTAKE", "MEAL_SERVICE"]}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(shelter_operating.pk), result_ids)
        self.assertIn(str(shelter_intake_only.pk), result_ids)
        self.assertIn(str(shelter_meal_only.pk), result_ids)
        self.assertNotIn(
            str(shelter_no_match.pk),
            result_ids,
            "Shelter with only STAFF_AVAILABILITY schedule (outside requested types) must be excluded.",
        )

    def test_shelter_open_now_for_multiple_types_exception_per_type(self) -> None:
        """A partial exception for one schedule type must not close the shelter under a different type."""
        # Monday 1:00 PM PST
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        # OPERATING window covering 1 PM.
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        # INTAKE window covering 1 PM.
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        # Partial exception on INTAKE only, covering 1 PM.  OPERATING must
        # remain unaffected, so the shelter still appears when OPERATING is
        # requested — even alongside INTAKE.
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 30),
            end_time=datetime.time(13, 30),
            is_exception=True,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response_both = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING", "INTAKE"]}},
            )
            response_intake_only = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["INTAKE"]}},
            )

        both_ids = {r["id"] for r in response_both["data"]["shelters"]["results"]}
        intake_only_ids = {r["id"] for r in response_intake_only["data"]["shelters"]["results"]}

        self.assertIn(
            str(shelter.pk),
            both_ids,
            "Shelter must appear via OPERATING even though INTAKE has an active exception.",
        )
        self.assertNotIn(
            str(shelter.pk),
            intake_only_ids,
            "Shelter must be excluded when only INTAKE is requested and INTAKE has an active exception.",
        )

    def test_shelter_open_now_full_day_exception_is_per_type(self) -> None:
        """A full-day (permanent) exception only closes its own schedule type in the union."""
        # Monday 1:00 PM PST
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        closed_for_operating = shelter_recipe.make(status=StatusChoices.APPROVED)

        # OPERATING window covering 1 PM.
        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        # INTAKE window covering 1 PM.
        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        # Permanent full-day closure recorded under OPERATING only. It must
        # close the shelter for OPERATING-only queries, but the shelter must
        # still appear when INTAKE is among the requested types (union).
        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        open_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )
        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response_operating = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING"]}},
            )
            response_intake = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["INTAKE"]}},
            )
            response_both = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": ["OPERATING", "INTAKE"]}},
            )

        operating_ids = {r["id"] for r in response_operating["data"]["shelters"]["results"]}
        intake_ids = {r["id"] for r in response_intake["data"]["shelters"]["results"]}
        both_ids = {r["id"] for r in response_both["data"]["shelters"]["results"]}

        self.assertNotIn(
            str(closed_for_operating.pk),
            operating_ids,
            "Permanent OPERATING closure must exclude the shelter from OPERATING-only queries.",
        )
        self.assertIn(
            str(closed_for_operating.pk),
            intake_ids,
            "Permanent OPERATING closure must NOT exclude the shelter from INTAKE-only queries.",
        )
        self.assertIn(
            str(closed_for_operating.pk),
            both_ids,
            "Permanent OPERATING closure must NOT exclude the shelter when OPERATING and INTAKE are requested.",
        )
        self.assertIn(
            str(open_shelter.pk),
            operating_ids,
            "Shelter without an exception must appear for OPERATING.",
        )
        self.assertIn(
            str(open_shelter.pk),
            intake_ids,
            "Shelter without an exception must appear for INTAKE.",
        )
        self.assertIn(
            str(open_shelter.pk),
            both_ids,
            "Shelter without an exception must appear for OPERATING and INTAKE.",
        )

    @parametrize(
        "open_now_for",
        [
            [],
            None,
        ],
    )
    def test_shelter_open_now_for_empty_or_null_is_noop(self, open_now_for: list[ScheduleTypeChoices] | None) -> None:
        """An empty or null schedule-type list disables the filter (does not exclude shelters)."""
        no_schedule_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        closed_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        # closed_shelter has an OPERATING schedule that does NOT cover "now", so
        # it would be excluded if the filter were (incorrectly) applied.

        # Monday 1:00 PM PST — outside closed_shelter's 8–10 AM window.
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        Schedule.objects.create(
            shelter=closed_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(10, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNowFor": open_now_for}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(no_schedule_shelter.pk), result_ids)
        self.assertIn(
            str(closed_shelter.pk),
            result_ids,
            "A shelter with no currently-open schedule must still be returned when the openNowFor filter is a no-op.",
        )

    def test_shelter_open_now_filter(self) -> None:
        open_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        closed_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        fixed_utc_now = datetime.datetime(
            2026,
            1,
            5,
            20,
            0,
            tzinfo=datetime.timezone.utc,
        )

        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )
        Schedule.objects.create(
            shelter=closed_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(10, 0),
            is_exception=False,
        )

        query = """
            query ($filters: PublicShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_utc_now.astimezone(datetime.timezone(datetime.timedelta(hours=-8))),
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        results = response["data"]["shelters"]["results"]
        result_ids = {result["id"] for result in results}

        self.assertIn(str(open_shelter.pk), result_ids)
        self.assertNotIn(str(closed_shelter.pk), result_ids)

    def test_shelter_open_now_excludes_permanent_closed_exception(self) -> None:
        """A shelter with a permanent closed exception (no date bounds)
        for the current day should NOT appear in Open Now results."""
        shelter_with_exception = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_without_exception = shelter_recipe.make(status=StatusChoices.APPROVED)

        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        for shelter in (shelter_with_exception, shelter_without_exception):
            Schedule.objects.create(
                shelter=shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                start_time=datetime.time(8, 0),
                end_time=datetime.time(18, 0),
                is_exception=False,
            )

        Schedule.objects.create(
            shelter=shelter_with_exception,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertNotIn(
            str(shelter_with_exception.pk),
            result_ids,
            "Shelter with a permanent closed exception should be excluded from Open Now",
        )
        self.assertIn(str(shelter_without_exception.pk), result_ids)

    def test_shelter_open_now_no_exceptions(self) -> None:
        """Regression: shelters open on Monday must not be excluded because of
        a *different-day* permanent closed exception on the same shelter."""
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.TUESDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(
            str(shelter.pk),
            result_ids,
            "Shelter with regular hours and no exceptions must appear in Open Now",
        )

    def test_shelter_open_now_every_day_schedule(self) -> None:
        """Schedules with day=NULL mean 'every day' and must be matched
        by the Open Now filter regardless of the current weekday."""
        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(
            str(shelter.pk),
            result_ids,
            "Shelter with day=NULL (every-day) schedule must appear in Open Now",
        )

    def test_shelter_open_now_excludes_partial_day_exception(self) -> None:
        """A shelter with a partial-day exception covering the current time
        should NOT appear in Open Now results, but a shelter whose partial
        exception does NOT cover the current time should still appear."""
        shelter_during = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_outside = shelter_recipe.make(status=StatusChoices.APPROVED)

        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        for shelter in (shelter_during, shelter_outside):
            Schedule.objects.create(
                shelter=shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                start_time=datetime.time(8, 0),
                end_time=datetime.time(18, 0),
                is_exception=False,
            )

        Schedule.objects.create(
            shelter=shelter_during,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=True,
        )

        Schedule.objects.create(
            shelter=shelter_outside,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(15, 0),
            end_time=datetime.time(16, 0),
            is_exception=True,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertNotIn(
            str(shelter_during.pk),
            result_ids,
            "Shelter with partial exception covering current time must be excluded",
        )
        self.assertIn(
            str(shelter_outside.pk),
            result_ids,
            "Shelter with partial exception NOT covering current time must appear",
        )

    def test_shelter_open_now_multiple_schedule_types(self) -> None:
        """openNow accepts a list of schedule types and returns shelters open in ANY of them (union)."""
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        shelter_operating = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        shelter_intake_only = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_intake_only,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        shelter_meal_only = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_meal_only,
            schedule_type=ScheduleTypeChoices.MEAL_SERVICE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 30),
            end_time=datetime.time(13, 30),
            is_exception=False,
        )

        shelter_no_match = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=shelter_no_match,
            schedule_type=ScheduleTypeChoices.STAFF_AVAILABILITY,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(20, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING", "INTAKE", "MEAL_SERVICE"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(shelter_operating.pk), result_ids)
        self.assertIn(str(shelter_intake_only.pk), result_ids)
        self.assertIn(str(shelter_meal_only.pk), result_ids)
        self.assertNotIn(
            str(shelter_no_match.pk),
            result_ids,
            "Shelter with only STAFF_AVAILABILITY schedule (outside requested types) must be excluded.",
        )

    def test_shelter_open_now_multiple_types_exception_per_type(self) -> None:
        """A partial exception for one schedule type must not close the shelter under a different type."""
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 30),
            end_time=datetime.time(13, 30),
            is_exception=True,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response_both = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING", "INTAKE"]}}},
            )
            response_intake_only = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["INTAKE"]}}},
            )

        both_ids = {r["id"] for r in response_both["data"]["shelters"]["results"]}
        intake_only_ids = {r["id"] for r in response_intake_only["data"]["shelters"]["results"]}

        self.assertIn(
            str(shelter.pk),
            both_ids,
            "Shelter must appear via OPERATING even though INTAKE has an active exception.",
        )
        self.assertNotIn(
            str(shelter.pk),
            intake_only_ids,
            "Shelter must be excluded when only INTAKE is requested and INTAKE has an active exception.",
        )

    def test_shelter_open_now_full_day_exception_is_per_type_union(self) -> None:
        """A full-day (permanent) exception only closes its own schedule type in the union."""
        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        closed_for_operating = shelter_recipe.make(status=StatusChoices.APPROVED)

        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )

        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        Schedule.objects.create(
            shelter=closed_for_operating,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
            start_date=None,
            end_date=None,
        )

        open_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(18, 0),
            is_exception=False,
        )
        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(12, 0),
            end_time=datetime.time(14, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response_operating = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )
            response_intake = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["INTAKE"]}}},
            )
            response_both = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING", "INTAKE"]}}},
            )

        operating_ids = {r["id"] for r in response_operating["data"]["shelters"]["results"]}
        intake_ids = {r["id"] for r in response_intake["data"]["shelters"]["results"]}
        both_ids = {r["id"] for r in response_both["data"]["shelters"]["results"]}

        self.assertNotIn(
            str(closed_for_operating.pk),
            operating_ids,
            "Permanent OPERATING closure must exclude the shelter from OPERATING-only queries.",
        )
        self.assertIn(
            str(closed_for_operating.pk),
            intake_ids,
            "Permanent OPERATING closure must NOT exclude the shelter from INTAKE-only queries.",
        )
        self.assertIn(
            str(closed_for_operating.pk),
            both_ids,
            "Permanent OPERATING closure must NOT exclude the shelter when OPERATING and INTAKE are requested.",
        )
        self.assertIn(
            str(open_shelter.pk),
            operating_ids,
            "Shelter without an exception must appear for OPERATING.",
        )
        self.assertIn(
            str(open_shelter.pk),
            intake_ids,
            "Shelter without an exception must appear for INTAKE.",
        )
        self.assertIn(
            str(open_shelter.pk),
            both_ids,
            "Shelter without an exception must appear for OPERATING and INTAKE.",
        )

    @parametrize(
        "open_now",
        [
            None,
            {},
            {"scheduleType": None},
            {"scheduleType": []},
        ],
    )
    def test_shelter_open_now_empty_or_null_is_noop(self, open_now: dict[str, Any] | None) -> None:
        """An empty or null openNow input disables the filter (does not exclude shelters)."""
        no_schedule_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        closed_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)
        # closed_shelter has an OPERATING schedule that does NOT cover "now", so
        # it would be excluded if the filter were (incorrectly) applied.

        fixed_pst = datetime.datetime(
            2026,
            1,
            5,
            13,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        Schedule.objects.create(
            shelter=closed_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(8, 0),
            end_time=datetime.time(10, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": open_now}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(no_schedule_shelter.pk), result_ids)
        self.assertIn(
            str(closed_shelter.pk),
            result_ids,
            "A shelter with no currently-open schedule must still be returned when the openNow filter is a no-op.",
        )

    def test_shelter_open_now_full_day_open_schedule(self) -> None:
        """A full-day schedule (start_time IS NULL, non-exception) is open all day."""
        full_day_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        fixed_pst_noon = datetime.datetime(
            2026,
            1,
            5,
            12,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        Schedule.objects.create(
            shelter=full_day_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(
            str(full_day_shelter.pk),
            result_ids,
            "Shelter with a full-day (no times) schedule must appear in Open Now",
        )

    def test_shelter_open_now_overnight_schedule(self) -> None:
        """A shelter open Monday 6 PM – 2 AM is open early Tuesday and closed at its exclusive end time."""
        overnight_shelter = shelter_recipe.make(status=StatusChoices.APPROVED)

        Schedule.objects.create(
            shelter=overnight_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(2, 0),
            is_exception=False,
        )

        query = self.get_shelters_query("id")

        tuesday_early = datetime.datetime(
            2026,
            1,
            6,
            1,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )
        tuesday_close = datetime.datetime(
            2026,
            1,
            6,
            2,
            0,
            tzinfo=datetime.timezone(datetime.timedelta(hours=-8)),
        )

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=tuesday_early,
        ):
            response_open = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=tuesday_close,
        ):
            response_closed = self.execute_graphql(
                query,
                variables={"filters": {"openNow": {"scheduleType": ["OPERATING"]}}},
            )

        open_ids = {r["id"] for r in response_open["data"]["shelters"]["results"]}
        closed_ids = {r["id"] for r in response_closed["data"]["shelters"]["results"]}

        self.assertIn(
            str(overnight_shelter.pk),
            open_ids,
            "Overnight shelter (6 PM – 2 AM) must be open at 1 AM Tuesday.",
        )
        self.assertNotIn(
            str(overnight_shelter.pk),
            closed_ids,
            "Overnight shelter must be closed at exactly 2 AM (end time is exclusive).",
        )

    def test_shelter_has_available_beds_filter_true(self) -> None:
        """Only shelters with available beds (non_restricted or restricted > 0) are returned."""
        from shelters.models import ShelterAvailability

        shelter_with_non_restricted = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_with_restricted = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_no_available = shelter_recipe.make(status=StatusChoices.APPROVED)

        ShelterAvailability.objects.filter(shelter=shelter_with_non_restricted).update(
            non_restricted_beds=5, restricted_beds=0
        )
        ShelterAvailability.objects.filter(shelter=shelter_with_restricted).update(
            non_restricted_beds=0, restricted_beds=3
        )
        ShelterAvailability.objects.filter(shelter=shelter_no_available).update(
            non_restricted_beds=0, restricted_beds=0
        )

        query = self.get_shelters_query("id")

        response = self.execute_graphql(
            query,
            variables={"filters": {"hasAvailableBeds": True}},
        )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(shelter_with_non_restricted.pk), result_ids)
        self.assertIn(str(shelter_with_restricted.pk), result_ids)
        self.assertNotIn(str(shelter_no_available.pk), result_ids)

    def test_shelter_has_available_beds_filter_false(self) -> None:
        """When hasAvailableBeds=false, only shelters WITHOUT available beds are returned."""
        from shelters.models import ShelterAvailability

        shelter_with_beds = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_no_beds = shelter_recipe.make(status=StatusChoices.APPROVED)

        ShelterAvailability.objects.filter(shelter=shelter_with_beds).update(non_restricted_beds=2, restricted_beds=1)
        ShelterAvailability.objects.filter(shelter=shelter_no_beds).update(non_restricted_beds=0, restricted_beds=0)

        query = self.get_shelters_query("id")

        response = self.execute_graphql(
            query,
            variables={"filters": {"hasAvailableBeds": False}},
        )

        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertNotIn(str(shelter_with_beds.pk), result_ids)
        self.assertIn(str(shelter_no_beds.pk), result_ids)

    def test_shelter_has_available_beds_filter_null(self) -> None:
        """When hasAvailableBeds is null/omitted, all shelters are returned regardless of availability."""
        from shelters.models import ShelterAvailability

        shelter_with_beds = shelter_recipe.make(status=StatusChoices.APPROVED)
        shelter_no_beds = shelter_recipe.make(status=StatusChoices.APPROVED)

        ShelterAvailability.objects.filter(shelter=shelter_with_beds).update(non_restricted_beds=3, restricted_beds=0)
        ShelterAvailability.objects.filter(shelter=shelter_no_beds).update(non_restricted_beds=0, restricted_beds=0)

        query = self.get_shelters_query("id")

        response = self.execute_graphql(
            query,
            variables={"filters": {"hasAvailableBeds": None}},
        )

        self.assertEqual(response["data"]["shelters"]["totalCount"], 2)
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertIn(str(shelter_with_beds.pk), result_ids)
        self.assertIn(str(shelter_no_beds.pk), result_ids)

    def test_on_site_security_filter(self) -> None:
        with_security = shelter_recipe.make(status=StatusChoices.APPROVED, on_site_security=True)
        shelter_recipe.make(status=StatusChoices.APPROVED, on_site_security=False)

        query = self.get_shelters_query("id")
        response = self.execute_graphql(query, variables={"filters": {"onSiteSecurity": True}})
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(with_security.id)})

    def test_accessibility_filter(self) -> None:
        ada = Accessibility.objects.get_or_create(name=AccessibilityChoices.ADA_ROOMS)[0]
        wheelchair = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)[0]
        match = shelter_recipe.make(status=StatusChoices.APPROVED, accessibility=[ada])
        shelter_recipe.make(status=StatusChoices.APPROVED, accessibility=[wheelchair])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(
            query,
            variables={"filters": {"accessibility": [AccessibilityChoices.ADA_ROOMS.name]}},
        )
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_storage_filter(self) -> None:
        lockers = Storage.objects.get_or_create(name=StorageChoices.STANDARD_LOCKERS)[0]
        shared = Storage.objects.get_or_create(name=StorageChoices.SHARED_STORAGE)[0]
        match = shelter_recipe.make(status=StatusChoices.APPROVED, storage=[lockers])
        shelter_recipe.make(status=StatusChoices.APPROVED, storage=[shared])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(
            query,
            variables={"filters": {"storage": [StorageChoices.STANDARD_LOCKERS.name]}},
        )
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_shelter_programs_filter(self) -> None:
        emergency = ShelterProgram.objects.get_or_create(name=ShelterProgramChoices.EMERGENCY_SHELTER)[0]
        interim = ShelterProgram.objects.get_or_create(name=ShelterProgramChoices.INTERIM_HOUSING)[0]
        match = shelter_recipe.make(status=StatusChoices.APPROVED, shelter_programs=[emergency])
        shelter_recipe.make(status=StatusChoices.APPROVED, shelter_programs=[interim])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(
            query,
            variables={"filters": {"shelterPrograms": [ShelterProgramChoices.EMERGENCY_SHELTER.name]}},
        )
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_city_filter(self) -> None:
        city_a = City.objects.get_or_create(name="Filter City A")[0]
        city_b = City.objects.get_or_create(name="Filter City B")[0]
        match = shelter_recipe.make(status=StatusChoices.APPROVED, city=city_a)
        shelter_recipe.make(status=StatusChoices.APPROVED, city=city_b)

        query = self.get_shelters_query("id")
        response = self.execute_graphql(query, variables={"filters": {"city": [str(city_a.id)]}})
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_cities_served_filter(self) -> None:
        city_a = City.objects.get_or_create(name="Served City A")[0]
        city_b = City.objects.get_or_create(name="Served City B")[0]
        match = shelter_recipe.make(status=StatusChoices.APPROVED, cities_served=[city_a])
        shelter_recipe.make(status=StatusChoices.APPROVED, cities_served=[city_b])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(query, variables={"filters": {"citiesServed": [str(city_a.id)]}})
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_spas_served_filter(self) -> None:
        spa_a, _ = SPA.objects.get_or_create(short_name="1", defaults={"long_name": "1 - Antelope Valley"})
        spa_b, _ = SPA.objects.get_or_create(short_name="2", defaults={"long_name": "2 - San Fernando Valley"})
        match = shelter_recipe.make(status=StatusChoices.APPROVED, spas_served=[spa_a])
        shelter_recipe.make(status=StatusChoices.APPROVED, spas_served=[spa_b])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(query, variables={"filters": {"spasServed": [str(spa_a.id)]}})
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})

    def test_services_filter(self) -> None:
        category, _ = ServiceCategory.objects.get_or_create(
            name="filter_general",
            defaults={"display_name": "Filter General", "priority": 0},
        )
        service_a, _ = Service.objects.get_or_create(
            category=category,
            name="filter_service_a",
            defaults={"display_name": "Filter Service A", "priority": 0},
        )
        service_b, _ = Service.objects.get_or_create(
            category=category,
            name="filter_service_b",
            defaults={"display_name": "Filter Service B", "priority": 1},
        )
        match = shelter_recipe.make(status=StatusChoices.APPROVED, services=[service_a])
        shelter_recipe.make(status=StatusChoices.APPROVED, services=[service_b])

        query = self.get_shelters_query("id")
        response = self.execute_graphql(query, variables={"filters": {"services": [str(service_a.id)]}})
        result_ids = {r["id"] for r in response["data"]["shelters"]["results"]}
        self.assertEqual(result_ids, {str(match.id)})


class OperatorShelterFilterQueryTestCase(GraphQLBaseTestCase):
    """Tests for filters that exist only on ``OperatorShelterFilter``."""

    def setUp(self) -> None:
        super().setUp()
        from notes.groups import CASEWORKER

        app_label, codename = Shelter.perms.VIEW.split(".")
        perm = Permission.objects.get(codename=codename, content_type__app_label=app_label)
        self.org_1.permission_groups.get(template__name=CASEWORKER.name).group.permissions.add(perm)
        self.graphql_client.force_login(self.org_1_case_manager_1)

    def get_shelters_query(self, fields: str) -> str:
        return f"""
            query ($filters: OperatorShelterFilter, $ordering: [ShelterOrder!]) {{
                operatorShelters (filters: $filters, ordering: $ordering) {{
                    totalCount
                    results {{{fields}}}
                }}
            }}
        """

    def _result_ids(self, filters: dict[str, Any]) -> set[str]:
        response = self.execute_graphql(
            self.get_shelters_query("id"),
            variables={"filters": filters},
        )
        self.assertIsNone(response.get("errors"))
        return {r["id"] for r in response["data"]["operatorShelters"]["results"]}

    def test_search_filter(self) -> None:
        """Search matches name, org name, description, or subjective review."""
        self.org_1.name = "Alpha House Network"
        self.org_1.save()
        shelter = shelter_recipe.make(
            organization=self.org_1,
            name="Safe Haven",
            description="offers free breakfast every morning",
            subjective_review="exceptionally clean facility",
        )
        expected = {str(shelter.id)}

        self.assertEqual(self._result_ids({"search": "safe haven"}), expected)
        self.assertEqual(self._result_ids({"search": "alpha house"}), expected)
        self.assertEqual(self._result_ids({"search": "free breakfast"}), expected)
        self.assertEqual(self._result_ids({"search": "exceptionally clean"}), expected)
        self.assertEqual(self._result_ids({"search": "nonexistent-term"}), set())

        # Empty / whitespace / absent search is a no-op.
        all_ids = self._result_ids({})
        self.assertEqual(self._result_ids({"search": ""}), all_ids)
        self.assertEqual(self._result_ids({"search": "   "}), all_ids)
        self.assertEqual(self._result_ids({"search": None}), all_ids)

    def test_status_filter(self) -> None:
        approved = shelter_recipe.make(organization=self.org_1, status=StatusChoices.APPROVED)
        draft = shelter_recipe.make(organization=self.org_1, status=StatusChoices.DRAFT)

        self.assertEqual(
            self._result_ids({"status": [StatusChoices.DRAFT.name]}),
            {str(draft.id)},
        )
        self.assertIn(str(approved.id), self._result_ids({"status": [StatusChoices.APPROVED.name]}))

    def test_city_council_district_filter(self) -> None:
        match = shelter_recipe.make(organization=self.org_1, city_council_district=5)
        shelter_recipe.make(organization=self.org_1, city_council_district=12)

        self.assertEqual(self._result_ids({"cityCouncilDistrict": [5]}), {str(match.id)})

    def test_supervisorial_district_filter(self) -> None:
        match = shelter_recipe.make(organization=self.org_1, supervisorial_district=2)
        shelter_recipe.make(organization=self.org_1, supervisorial_district=4)

        self.assertEqual(self._result_ids({"supervisorialDistrict": [2]}), {str(match.id)})

    def test_overall_rating_filter(self) -> None:
        match = shelter_recipe.make(organization=self.org_1, overall_rating=5)
        shelter_recipe.make(organization=self.org_1, overall_rating=2)

        self.assertEqual(self._result_ids({"overallRating": [5]}), {str(match.id)})
