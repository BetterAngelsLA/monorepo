import datetime
from typing import Any
from unittest.mock import patch

from common.tests.utils import GraphQLBaseTestCase
from django.db import connection
from django.test.utils import CaptureQueriesContext
from places import Places
from shelters.enums import (
    DayOfWeekChoices,
    ParkingChoices,
    PetChoices,
    ScheduleTypeChoices,
    ShelterChoices,
    StatusChoices,
)
from shelters.models import Parking, Pet, Shelter, ShelterType
from shelters.models.schedule import Schedule
from shelters.tests.baker_recipes import shelter_recipe
from unittest_parametrize import parametrize


class ShelterFilterQueryTestCase(GraphQLBaseTestCase):
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
                    latitude=f"{reference_point["latitude"]}.{i}",
                    longitude=f"{reference_point["longitude"]}.{i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(3, 0, -1)
        ]

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                        distanceInMiles
                    }
                }
            }
        """

        filters: dict[str, Any] = {}
        filters["geolocation"] = {
            "latitude": reference_point["latitude"],
            "longitude": reference_point["longitude"],
            "rangeInMiles": search_range_in_miles,
        }

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
                    latitude=f"{reference_point["latitude"] - i}",
                    longitude=f"{reference_point["longitude"] - i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(8, -2, -2)
        ]

        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

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

        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    results {
                        id
                    }
                }
            }
        """

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
                    latitude=f"{reference_point["latitude"] - i}",
                    longitude=f"{reference_point["longitude"] - i}",
                ),
                status=StatusChoices.APPROVED,
            )
            for i in range(8, -2, -2)
        ]

        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

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
        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

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

        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """
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

        query = """
            query ($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

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

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results {
                        id
                    }
                }
            }
        """

        filters: dict[str, Any] = {}
        filters["properties"] = property_filters

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(query, variables={"filters": filters})

        results = response["data"]["shelters"]["results"]

        self.assertEqual(len(results), expected_result_count)

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
            query ViewShelters($filters: ShelterFilter) {
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
                variables={"filters": {"openNow": True}},
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

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results { id }
                }
            }
        """

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": True}},
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

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results { id }
                }
            }
        """

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": True}},
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

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results { id }
                }
            }
        """

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst_noon,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": True}},
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

        query = """
            query ViewShelters($filters: ShelterFilter) {
                shelters(filters: $filters) {
                    totalCount
                    results { id }
                }
            }
        """

        with patch(
            "shelters.types.filters.get_current_shelter_schedule_datetime",
            return_value=fixed_pst,
        ):
            response = self.execute_graphql(
                query,
                variables={"filters": {"openNow": True}},
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
