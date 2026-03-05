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
    GeneralServiceChoices,
    ScheduleTypeChoices,
    ShelterChoices,
)
from shelters.models import Demographic, GeneralService, Schedule, Shelter, ShelterType


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
                "shelter.general_service.add",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.add"))
        self.assertEqual(1, event_labels.count("shelter.demographic.add"))
        self.assertEqual(2, event_labels.count("shelter.general_service.add"))

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
                "shelter.general_service.remove",
            ]
        )
        self.assertEqual(shelter_associated_events.count(), 4)

        event_labels = [event.pgh_label for event in shelter_associated_events]
        self.assertEqual(1, event_labels.count("shelter.shelter_type.remove"))
        self.assertEqual(1, event_labels.count("shelter.demographic.remove"))
        self.assertEqual(2, event_labels.count("shelter.general_service.remove"))

    def _create_shelter(self, shelter_name: str) -> Shelter:
        # Create related models for ManyToMany fields
        shelter_type = ShelterType.objects.create(name=ShelterChoices.BUILDING)
        population = Demographic.objects.create(name=DemographicChoices.SINGLE_MEN)
        general_service_1 = GeneralService.objects.create(name=GeneralServiceChoices.CASE_MANAGEMENT)
        general_service_2 = GeneralService.objects.create(name=GeneralServiceChoices.CHILDCARE)

        # Create shelter and add ManyToMany relationships
        shelter = Shelter.objects.create(name=shelter_name)
        shelter.shelter_types.add(shelter_type)
        shelter.demographics.add(population)
        shelter.general_services.add(general_service_1, general_service_2)
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
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )
        self.assertEqual(schedule.shelter, self.shelter)
        self.assertEqual(schedule.schedule_type, ScheduleTypeChoices.OPERATING)
        self.assertEqual(schedule.day, DayOfWeekChoices.MONDAY)
        self.assertEqual(schedule.open_time, datetime.time(9, 0))
        self.assertEqual(schedule.close_time, datetime.time(17, 0))
        self.assertFalse(schedule.is_closed)

    def test_create_closed_day(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.SUNDAY,
            is_closed=True,
        )
        self.assertTrue(schedule.is_closed)
        self.assertIsNone(schedule.open_time)
        self.assertIsNone(schedule.close_time)
        self.assertIn("(Closed)", str(schedule))

    def test_multiple_time_windows(self) -> None:
        """Multiple time windows per day are separate Schedule rows."""
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(7, 0),
            close_time=datetime.time(12, 0),
        )
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(17, 0),
            close_time=datetime.time(22, 0),
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
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )
        with self.assertRaises(IntegrityError):
            Schedule.objects.create(
                shelter=self.shelter,
                schedule_type=ScheduleTypeChoices.OPERATING,
                day=DayOfWeekChoices.MONDAY,
                open_time=datetime.time(9, 0),
                close_time=datetime.time(18, 0),
            )

    def test_different_types_same_day_allowed(self) -> None:
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(0, 0),
            close_time=datetime.time(23, 59),
        )
        intake = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.INTAKE,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(9, 0),
            close_time=datetime.time(12, 0),
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
                open_time=datetime.time(8, 0),
                close_time=datetime.time(20, 0),
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
            open_time=datetime.time(18, 0),
            close_time=datetime.time(6, 0),
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
            open_time=datetime.time(0, 0),
            close_time=datetime.time(23, 59),
            condition=ConditionChoices.HEAT,
        )
        self.assertEqual(schedule.condition, ConditionChoices.HEAT)

    def test_demographic_scoped_schedule(self) -> None:
        demographic = Demographic.objects.create(name=DemographicChoices.SINGLE_WOMEN)
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            open_time=datetime.time(10, 0),
            close_time=datetime.time(14, 0),
            demographic=demographic,
        )
        self.assertEqual(schedule.demographic, demographic)

    def test_exception_override(self) -> None:
        """A single-date exception uses start_date == end_date, day is optional."""
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            is_closed=True,
            is_exception=True,
            start_date=datetime.date(2026, 12, 25),
            end_date=datetime.date(2026, 12, 25),
        )
        self.assertTrue(schedule.is_exception)
        self.assertIsNone(schedule.day)
        self.assertEqual(schedule.start_date, datetime.date(2026, 12, 25))
        self.assertEqual(schedule.end_date, datetime.date(2026, 12, 25))
        self.assertIn("Every day", str(schedule))

    def test_cascade_delete(self) -> None:
        Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )
        self.assertEqual(Schedule.objects.count(), 1)
        self.shelter.delete()
        self.assertEqual(Schedule.objects.count(), 0)

    def test_schedule_events(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )
        add_events = Events.objects.filter(pgh_label="shelter.schedule.add")
        self.assertEqual(add_events.count(), 1)

        schedule.is_closed = True
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
            open_time=datetime.time(9, 0),
            close_time=datetime.time(12, 0),
        )
        self.assertIn("Intake Hours", str(schedule))
        self.assertIn("Friday", str(schedule))
        self.assertNotIn("(Closed)", str(schedule))

        schedule.is_closed = True
        schedule.save()
        self.assertIn("(Closed)", str(schedule))

    def test_default_schedule_type(self) -> None:
        schedule = Schedule.objects.create(
            shelter=self.shelter,
            day=DayOfWeekChoices.MONDAY,
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
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
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )
        # Closed shelter: Wed is_closed=True
        Schedule.objects.create(
            shelter=closed_shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            is_closed=True,
        )

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
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
            start_date=datetime.date(2099, 1, 1),
        )

        self.assertIn(open_shelter, Shelter.objects.open_at(query_dt))
        self.assertNotIn(future_shelter, Shelter.objects.open_at(query_dt))

    def test_exception_subtracts_availability(self) -> None:
        """An is_exception + is_closed entry for a specific date should
        override the regular weekly schedule, causing the shelter to appear
        closed when the exception's date range is active.

        Scenario
        --------
        - Shelter has regular Wednesday 9 AM – 5 PM operating hours.
        - An exception marks Dec 25 as closed (is_exception=True, is_closed=True).
        - Querying "open on Wed at 2:30 PM" on Dec 25 should NOT return the shelter.
        - The same query on a normal Wednesday (e.g., Dec 4) SHOULD return it.
        """
        shelter = Shelter.objects.create(name="Holiday Shelter")

        # Regular weekly schedule: open Wed 9 AM – 5 PM
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            day=DayOfWeekChoices.WEDNESDAY,
            open_time=datetime.time(9, 0),
            close_time=datetime.time(17, 0),
        )

        # Exception: closed all day on Christmas (Dec 25, 2024 is a Wednesday)
        Schedule.objects.create(
            shelter=shelter,
            schedule_type=ScheduleTypeChoices.OPERATING,
            is_closed=True,
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
