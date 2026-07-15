import datetime
import random

from django.db import IntegrityError
from django.test import TestCase
from pghistory.models import Events
from places import Places
from shelters.enums import (
    ConditionChoices,
    DayOfWeekChoices,
    DemographicChoices,
    ScheduleTypeChoices,
    ShelterChoices,
)
from shelters.models import (
    Demographic,
    Schedule,
    Service,
    ServiceCategory,
    Shelter,
    ShelterType,
)


class ShelterModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = self._create_shelter("Test Shelter")

    def _get_random_shelter_location(self) -> Places:
        street_names = ["Main St", "Santa Monica Blvd", "Wilshire Blvd", "Venice Blvd"]
        latitude_bounds = [33.937143, 34.102757]
        longitude_bounds = [-118.493372, -118.246635]

        random_address = f"{random.randint(100, 20000)} {random.choice(street_names)}"
        random_latitude = str(round(random.uniform(latitude_bounds[0], latitude_bounds[1]), 4))
        random_longitude = str(round(random.uniform(longitude_bounds[0], longitude_bounds[1]), 4))

        return Places(
            place=random_address,
            latitude=random_latitude,
            longitude=random_longitude,
        )

    def test_save(self) -> None:
        location = self._get_random_shelter_location()
        shelter = Shelter.objects.create(location=location)

        assert shelter.geolocation
        self.assertEqual(str(shelter.location.latitude), str(shelter.geolocation.coords[1]))
        self.assertEqual(str(shelter.location.longitude), str(shelter.geolocation.coords[0]))

        shelter.location.latitude = "123.0"
        shelter.location.longitude = "-123.0"
        shelter.save()

        self.assertEqual(str(shelter.geolocation.coords[1]), "123.0")
        self.assertEqual(str(shelter.geolocation.coords[0]), "-123.0")

        shelter.location = None
        shelter.save()

        self.assertIsNone(shelter.geolocation)

    def test_create_shelter_events(self) -> None:
        # Verify shelter creation event
        shelter_events = Events.objects.filter(pgh_label="shelter.add")
        self.assertEqual(shelter_events.count(), 1)

        # Verify associated events
        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter.shelter_type.add",
                "shelter.demographic.add",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 2)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.add"))
        self.assertEqual(1, event_labels.count("shelter.demographic.add"))

    def test_delete_shelter_events(self) -> None:
        # Delete shelter and verify events
        self.shelter.delete()

        shelter_events = Events.objects.filter(pgh_label="shelter.remove")
        self.assertEqual(shelter_events.count(), 1)

        # Verify associated remove events
        shelter_associated_events = Events.objects.filter(
            pgh_label__in=[
                "shelter.shelter_type.remove",
                "shelter.demographic.remove",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 2)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.remove"))
        self.assertEqual(1, event_labels.count("shelter.demographic.remove"))

    def _create_shelter(self, shelter_name: str) -> Shelter:
        # Create related models for ManyToMany fields
        shelter_type = ShelterType.objects.create(name=ShelterChoices.BUILDING)
        population = Demographic.objects.create(name=DemographicChoices.SINGLE_MEN)
        service_category = ServiceCategory.objects.create(
            name=f"test_category_{shelter_name}",
            display_name="Test Services",
            priority=0,
        )
        service_1 = Service.objects.create(
            category=service_category,
            name=f"test_svc_1_{shelter_name}",
            display_name="Test Service 1",
            priority=0,
        )
        service_2 = Service.objects.create(
            category=service_category,
            name=f"test_svc_2_{shelter_name}",
            display_name="Test Service 2",
            priority=1,
        )

        # Create shelter and add ManyToMany relationships
        shelter = Shelter.objects.create(name=shelter_name)
        shelter.shelter_types.add(shelter_type)
        shelter.demographics.add(population)
        shelter.services.add(service_1, service_2)
        return shelter


class ScheduleModelTestCase(TestCase):
    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")

    def test_day_of_week_from_date(self) -> None:
        """DayOfWeekChoices.from_date() maps calendar dates to enum members."""
        # 2024-12-02 is a Monday, 2024-12-08 is a Sunday
        days = list(DayOfWeekChoices)
        for offset, expected in enumerate(days):
            d = datetime.date(2024, 12, 2) + datetime.timedelta(days=offset)
            self.assertEqual(DayOfWeekChoices.from_date(d), expected)

    def test_create_schedule(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        self.assertEqual(schedule.shelter, self.shelter)
        self.assertEqual(schedule.schedule_type, ScheduleTypeChoices.OPERATING)
        self.assertEqual(schedule.day, DayOfWeekChoices.MONDAY)
        self.assertEqual(schedule.start_time, datetime.time(9, 0))
        self.assertEqual(schedule.end_time, datetime.time(17, 0))

    def test_no_schedule_means_closed(self) -> None:
        """A shelter with no schedule rows for a day is considered closed."""
        # Only create a row for Monday — no row for Sunday.
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        self.assertFalse(
            self.shelter.schedules.filter(
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.SUNDAY,
            ).exists()
        )

    def test_multiple_time_windows(self) -> None:
        """Multiple time windows per day are separate Schedule rows."""
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(7, 0),
            end_time=datetime.time(12, 0),
        )
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(17, 0),
            end_time=datetime.time(22, 0),
        )
        self.assertEqual(
            self.shelter.schedules.filter(
                day=DayOfWeekChoices.MONDAY,
                schedule_type=ScheduleTypeChoices.OPERATING,
            ).count(),
            2,
        )

    def test_unique_constraint_same_type(self) -> None:
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        with self.assertRaises(IntegrityError):
            Schedule.objects.create(
                shelter=self.shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                start_time=datetime.time(9, 0),
                end_time=datetime.time(18, 0),
            )

    def test_different_types_same_day_allowed(self) -> None:
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(0, 0),
            end_time=datetime.time(23, 59),
        )
        intake = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
        )
        self.assertEqual(self.shelter.schedules.filter(day=DayOfWeekChoices.MONDAY).count(), 2)
        self.assertEqual(intake.schedule_type, ScheduleTypeChoices.INTAKE)

    def test_full_week_schedule(self) -> None:
        days = list(DayOfWeekChoices)
        for day in days:
            Schedule.objects.create(
                shelter=self.shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=day,
                start_time=datetime.time(8, 0),
                end_time=datetime.time(20, 0),
            )
        self.assertEqual(
            self.shelter.schedules.filter(schedule_type=ScheduleTypeChoices.OPERATING).count(),
            7,
        )

    def test_seasonal_schedule(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(6, 0),
            start_date=datetime.date(2026, 11, 1),
            end_date=datetime.date(2027, 3, 1),
        )
        self.assertEqual(schedule.start_date, datetime.date(2026, 11, 1))
        self.assertEqual(schedule.end_date, datetime.date(2027, 3, 1))

    def test_condition_triggered_schedule(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(0, 0),
            end_time=datetime.time(23, 59),
            condition=ConditionChoices.HEAT,
        )
        self.assertEqual(schedule.condition, ConditionChoices.HEAT)

    def test_demographic_scoped_schedule(self) -> None:
        demographic = Demographic.objects.create(name=DemographicChoices.SINGLE_WOMEN)
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(14, 0),
            demographic=demographic,
        )
        self.assertEqual(schedule.demographic, demographic)

    def test_exception_override(self) -> None:
        """A single-date exception uses start_date == end_date, day is optional.
        An exception with no times means closed all day."""
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            is_exception=True,
            start_date=datetime.date(2026, 12, 25),
            end_date=datetime.date(2026, 12, 25),
        )
        self.assertTrue(schedule.is_exception)
        self.assertIsNone(schedule.day)
        self.assertIsNone(schedule.start_time)
        self.assertEqual(schedule.start_date, datetime.date(2026, 12, 25))
        self.assertEqual(schedule.end_date, datetime.date(2026, 12, 25))
        self.assertIn("Exception", str(schedule))
        self.assertIn("Closed all day", str(schedule))

    def test_cascade_delete(self) -> None:
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        self.assertEqual(Schedule.objects.count(), 1)
        self.shelter.delete()
        self.assertEqual(Schedule.objects.count(), 0)

    def test_schedule_events(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        add_events = Events.objects.filter(pgh_label="shelter.schedule.add")
        self.assertEqual(add_events.count(), 1)

        schedule.start_time = datetime.time(10, 0)
        schedule.save()
        update_events = Events.objects.filter(pgh_label="shelter.schedule.update")
        self.assertEqual(update_events.count(), 1)

        schedule.delete()
        remove_events = Events.objects.filter(pgh_label="shelter.schedule.remove")
        self.assertEqual(remove_events.count(), 1)

    def test_str_representation(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.FRIDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(12, 0),
        )
        self.assertIn("Intake Hours", str(schedule))
        self.assertIn("Friday", str(schedule))

        # No times → label only
        no_times = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.SUNDAY,
        )
        self.assertIn("Sunday", str(no_times))

    def test_default_schedule_type(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        self.assertEqual(schedule.schedule_type, ScheduleTypeChoices.OPERATING)

    def test_open_now_query(self) -> None:
        """Verify Shelter.objects.open_at() and shelter.is_open_at()."""
        open_shelter = Shelter.objects.create(name="Open Shelter")
        closed_shelter = Shelter.objects.create(name="Closed Shelter")
        no_schedule_shelter = Shelter.objects.create(name="No Schedule")

        # Use a fixed "now" so the test is deterministic.
        # 2026-03-04 is a Wednesday.
        query_dt = datetime.datetime(2026, 3, 4, 14, 30)

        # Open shelter: Wed 9 AM – 5 PM (query_dt is inside)
        Schedule.objects.create(
            shelter=open_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        # Closed shelter: no schedule row with times for Wednesday
        # (absence of a row = closed)

        result = Shelter.objects.open_at(query_dt)

        self.assertIn(open_shelter, result)
        self.assertNotIn(closed_shelter, result)
        self.assertNotIn(no_schedule_shelter, result)

        # Instance convenience method
        self.assertTrue(open_shelter.is_open_at(query_dt))
        self.assertFalse(closed_shelter.is_open_at(query_dt))

        # Also verify seasonal date filtering works
        future_shelter = Shelter.objects.create(name="Future Shelter")
        Schedule.objects.create(
            shelter=future_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
            start_date=datetime.date(2099, 1, 1),
        )

        self.assertIn(open_shelter, Shelter.objects.open_at(query_dt))
        self.assertNotIn(future_shelter, Shelter.objects.open_at(query_dt))

    def test_open_at_overnight_schedule(self) -> None:
        """Verify ``shelters_open_at`` handles schedules that span midnight.

        A shelter open Monday 6 PM – 2 AM should be considered open at:
        - 10 PM Monday (same calendar day, after opening)
        - 1 AM Tuesday (next calendar day, before closing)
        - 1:59 AM Tuesday (one minute before closing)

        It should NOT be open at:
        - 5 PM Monday (before opening)
        - 2:00 AM Tuesday (end time is exclusive)
        - 2:01 AM Tuesday (after closing)
        """
        overnight_shelter = Shelter.objects.create(name="Overnight Shelter")

        # Monday 6 PM – 2 AM (next calendar day)
        Schedule.objects.create(
            shelter=overnight_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(2, 0),
        )

        # Same calendar day, after opening → should be open.
        monday_night = datetime.datetime(2026, 3, 2, 22, 0)  # Monday 10 PM
        self.assertIn(
            overnight_shelter,
            Shelter.objects.open_at(monday_night),
            "Overnight shelter (6 PM – 2 AM) should be open at 10 PM Monday.",
        )

        # Next calendar day, before closing → should be open.
        tuesday_early = datetime.datetime(2026, 3, 3, 1, 0)  # Tuesday 1 AM
        self.assertIn(
            overnight_shelter,
            Shelter.objects.open_at(tuesday_early),
            "Overnight shelter (6 PM – 2 AM) should be open at 1 AM Tuesday.",
        )

        # Same calendar day, before opening → should NOT be open.
        monday_evening = datetime.datetime(2026, 3, 2, 17, 0)  # Monday 5 PM
        self.assertNotIn(
            overnight_shelter,
            Shelter.objects.open_at(monday_evening),
            "Overnight shelter should NOT be open at 5 PM Monday (before 6 PM).",
        )

        # One minute before closing → should be open.
        tuesday_before_close = datetime.datetime(2026, 3, 3, 1, 59)  # Tuesday 1:59 AM
        self.assertIn(
            overnight_shelter,
            Shelter.objects.open_at(tuesday_before_close),
            "Overnight shelter should be open at 1:59 AM Tuesday (one minute before 2 AM close).",
        )

        # At closing time → NOT open (end time is exclusive).
        tuesday_closing = datetime.datetime(2026, 3, 3, 2, 0)  # Tuesday 2 AM
        self.assertNotIn(
            overnight_shelter,
            Shelter.objects.open_at(tuesday_closing),
            "Overnight shelter should NOT be open at exactly 2 AM (end time is exclusive).",
        )

        # Past closing → should NOT be open.
        tuesday_past = datetime.datetime(2026, 3, 3, 2, 1)  # Tuesday 2:01 AM
        self.assertNotIn(
            overnight_shelter,
            Shelter.objects.open_at(tuesday_past),
            "Overnight shelter should NOT be open at 2:01 AM (past closing).",
        )

    def test_exception_subtracts_availability(self) -> None:
        """An is_exception entry with no times for a specific date should
        override the regular weekly schedule, causing the shelter to appear
        closed when the exception's date range is active.

        Scenario
        --------
        - Shelter has regular Wednesday 9 AM – 5 PM operating hours.
        - An exception with no times marks Dec 25 as closed all day.
        - Querying "open on Wed at 2:30 PM" on Dec 25 should NOT return the shelter.
        - The same query on a normal Wednesday (e.g., Dec 4) SHOULD return it.
        """
        shelter = Shelter.objects.create(name="Holiday Shelter")

        # Regular weekly schedule: open Wed 9 AM – 5 PM
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )

        # Exception: closed all day on Christmas (Dec 25, 2024 is a Wednesday)
        # An exception with no times = closed all day.
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            is_exception=True,
            start_date=datetime.date(2024, 12, 25),
            end_date=datetime.date(2024, 12, 25),
        )

        # Normal Wednesday → shelter is open
        normal_wed = datetime.datetime(2024, 12, 4, 14, 30)
        self.assertIn(shelter, Shelter.objects.open_at(normal_wed))
        self.assertTrue(shelter.is_open_at(normal_wed))

        # Christmas Wednesday → exception closes it
        christmas = datetime.datetime(2024, 12, 25, 14, 30)
        self.assertNotIn(shelter, Shelter.objects.open_at(christmas))
        self.assertFalse(shelter.is_open_at(christmas))

    def test_open_at_full_day_exception_respects_day(self) -> None:
        """A full-day exception for a specific weekday should only close the
        shelter on that day, not on other days.

        Scenario
        --------
        - Shelter has a full-day operating schedule (every day, 0:00–23:59).
        - An exception closes the shelter on Mondays (no times = closed all day).
        - Querying on a Monday should NOT return the shelter.
        - Querying on a Tuesday SHOULD return the shelter.
        """
        shelter = Shelter.objects.create(name="Exception Shelter")

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(0, 0),
            end_time=datetime.time(23, 59),
        )

        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
        )

        monday = datetime.datetime(2026, 3, 2, 12, 0)
        tuesday = datetime.datetime(2026, 3, 3, 12, 0)

        self.assertNotIn(shelter, Shelter.objects.open_at(monday))
        self.assertIn(shelter, Shelter.objects.open_at(tuesday))

    def test_generated_columns_are_computed_correctly(self) -> None:
        """Verify ``start_cycle_minutes`` and ``duration_minutes`` are
        computed correctly by the database for various schedule types."""
        shelter = Shelter.objects.create(name="GC Test Shelter")

        # Normal schedule: Wed 9 AM – 5 PM (540 min open window)
        s1 = Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
        )
        s1.refresh_from_db()
        # Wednesday = day index 2 → 2 * 1440 + 540 = 3420
        self.assertEqual(s1.start_cycle_minutes, 3420)
        self.assertEqual(s1.duration_minutes, 480)  # 8 h

        # Overnight schedule: Mon 6 PM – 2 AM (next day)
        s2 = Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            start_time=datetime.time(18, 0),
            end_time=datetime.time(2, 0),
        )
        s2.refresh_from_db()
        # Monday = index 0 → 1080; duration = (120 − 1080 + 1440) % 1440 = 480
        self.assertEqual(s2.start_cycle_minutes, 1080)
        self.assertEqual(s2.duration_minutes, 480)  # 8 h overnight

        # Every-day schedule (day=None): 10 PM – 6 AM
        s3 = Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(22, 0),
            end_time=datetime.time(6, 0),
        )
        s3.refresh_from_db()
        # day=None → offset is just the daily-minute offset
        self.assertEqual(s3.start_cycle_minutes, 1320)  # 22*60 = 1320
        # (360 − 1320 + 1440) % 1440 = 480
        self.assertEqual(s3.duration_minutes, 480)  # 8 h

        # Full-day schedule (no times)
        s4 = Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=None,
            end_time=None,
        )
        s4.refresh_from_db()
        self.assertIsNone(s4.start_cycle_minutes)
        self.assertIsNone(s4.duration_minutes)

        # 24 h schedule (midnight–midnight) → duration of 1440
        s5 = Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(0, 0),
            end_time=datetime.time(0, 0),
        )
        s5.refresh_from_db()
        self.assertEqual(s5.duration_minutes, 1440)  # COALESCE(NULLIF(0, 0), 1440) = 1440

    def test_open_at_every_day_overnight(self) -> None:
        """An every-day schedule (day=None) that spans midnight should work
        identically to day-specific overnight schedules."""
        shelter = Shelter.objects.create(name="EveryDay Overnight")

        # Every day 10 PM – 6 AM
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(22, 0),
            end_time=datetime.time(6, 0),
        )

        # Wednesday 11 PM → open (after 10 PM)
        wed_night = datetime.datetime(2026, 3, 4, 23, 0)  # Wednesday
        self.assertIn(shelter, Shelter.objects.open_at(wed_night))

        # Thursday 3 AM → open (before 6 AM)
        thu_early = datetime.datetime(2026, 3, 5, 3, 0)  # Thursday
        self.assertIn(shelter, Shelter.objects.open_at(thu_early))

        # Thursday 6 AM → NOT open (exclusive end)
        thu_close = datetime.datetime(2026, 3, 5, 6, 0)
        self.assertNotIn(shelter, Shelter.objects.open_at(thu_close))

        # Thursday 9 AM → NOT open (well past closing)
        thu_morning = datetime.datetime(2026, 3, 5, 9, 0)
        self.assertNotIn(shelter, Shelter.objects.open_at(thu_morning))

        # Wednesday 8 PM → NOT open (before 10 PM opening)
        wed_evening = datetime.datetime(2026, 3, 4, 20, 0)
        self.assertNotIn(shelter, Shelter.objects.open_at(wed_evening))

    def test_open_at_week_boundary(self) -> None:
        """A Sunday-night-to-Monday-morning overnight schedule should work
        correctly across the week boundary (Sunday 23:59 → Monday 00:00)."""
        shelter = Shelter.objects.create(name="Week Boundary Shelter")

        # Sunday 8 PM – Monday 3 AM
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.SUNDAY,
            start_time=datetime.time(20, 0),
            end_time=datetime.time(3, 0),
        )

        # Sunday 10 PM → open
        sun_night = datetime.datetime(2026, 3, 8, 22, 0)  # Sunday
        self.assertIn(shelter, Shelter.objects.open_at(sun_night))

        # Monday 1 AM → open (before closing)
        mon_early = datetime.datetime(2026, 3, 9, 1, 0)  # Monday
        self.assertIn(shelter, Shelter.objects.open_at(mon_early))

        # Monday 3 AM → NOT open (exclusive end)
        mon_close = datetime.datetime(2026, 3, 9, 3, 0)  # Monday
        self.assertNotIn(shelter, Shelter.objects.open_at(mon_close))

        # Sunday 7 PM → NOT open (before opening)
        sun_evening = datetime.datetime(2026, 3, 8, 19, 0)
        self.assertNotIn(shelter, Shelter.objects.open_at(sun_evening))

    def test_open_at_24h_schedule(self) -> None:
        """A 24-hour schedule (midnight–midnight or 0:00–23:59) should
        be open all day."""
        shelter = Shelter.objects.create(name="24h Shelter")

        # Every day, midnight–midnight (duration = 1440 via COALESCE fallback)
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=None,
            start_time=datetime.time(0, 0),
            end_time=datetime.time(0, 0),
        )

        for hour in (0, 6, 12, 18, 23):
            dt = datetime.datetime(2026, 3, 4, hour, 30)
            self.assertIn(
                shelter,
                Shelter.objects.open_at(dt),
                f"24h shelter should be open at {hour}:30",
            )

        # Exception closing a specific day should override
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            start_time=None,
            end_time=None,
            is_exception=True,
        )
        wed_noon = datetime.datetime(2026, 3, 4, 12, 0)  # Wednesday
        self.assertNotIn(shelter, Shelter.objects.open_at(wed_noon))


class CreateSchedulesServiceTestCase(TestCase):
    """Tests for _create_schedules multi-day fan-out."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Fan-out Shelter")

    def test_multi_day_fanout(self) -> None:
        """A single input with days=[MON, TUE, WED] creates 3 Schedule rows."""
        from shelters.services.utils import _create_schedules

        _create_schedules(
            self.shelter,
            [
                {
                    "schedule_type": ScheduleTypeChoices.OPERATING,
                    "days": [
                        DayOfWeekChoices.MONDAY,
                        DayOfWeekChoices.TUESDAY,
                        DayOfWeekChoices.WEDNESDAY,
                    ],
                    "start_time": datetime.time(9, 0),
                    "end_time": datetime.time(17, 0),
                }
            ],
        )
        self.assertEqual(self.shelter.schedules.count(), 3)
        created_days = set(self.shelter.schedules.values_list("day", flat=True))
        self.assertEqual(
            created_days,
            {DayOfWeekChoices.MONDAY, DayOfWeekChoices.TUESDAY, DayOfWeekChoices.WEDNESDAY},
        )

    def test_empty_days_creates_every_day_row(self) -> None:
        """An empty days list creates a single row with day=None (every day)."""
        from shelters.services.utils import _create_schedules

        _create_schedules(
            self.shelter,
            [
                {
                    "schedule_type": ScheduleTypeChoices.OPERATING,
                    "days": [],
                    "start_time": datetime.time(9, 0),
                    "end_time": datetime.time(17, 0),
                }
            ],
        )
        self.assertEqual(self.shelter.schedules.count(), 1)
        schedule = self.shelter.schedules.first()
        assert schedule is not None
        self.assertIsNone(schedule.day)

    def test_no_days_key_creates_every_day_row(self) -> None:
        """Omitting the 'days' key entirely creates a single row with day=None."""
        from shelters.services.utils import _create_schedules

        _create_schedules(
            self.shelter,
            [
                {
                    "schedule_type": ScheduleTypeChoices.OPERATING,
                    "start_time": datetime.time(8, 0),
                    "end_time": datetime.time(20, 0),
                }
            ],
        )
        self.assertEqual(self.shelter.schedules.count(), 1)
        schedule = self.shelter.schedules.first()
        assert schedule is not None
        self.assertIsNone(schedule.day)
