import datetime
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from places import Places
from shelters.enums import (
    AccessibilityChoices,
    ConditionChoices,
    DayOfWeekChoices,
    DemographicChoices,
    ScheduleTypeChoices,
    StatusChoices,
)
from shelters.models import Accessibility, Demographic, Schedule, Shelter
from shelters.services.utils import (
    _create_schedules,
    _get_m2m_field_names,
    _parse_location,
    _prepare_shelter_data,
    _set_m2m_from_enums,
    _validate_subset_attributes,
)


class GetM2mFieldNamesTestCase(TestCase):
    """Tests for _get_m2m_field_names."""

    def test_shelter_has_known_m2m_fields(self) -> None:
        """Shelter model has the expected M2M fields."""
        result = _get_m2m_field_names(Shelter)

        self.assertIn("demographics", result)
        self.assertIn("accessibility", result)
        self.assertIn("pets", result)
        self.assertIn("parking", result)

    def test_returns_set(self) -> None:
        """Result is a set."""
        result = _get_m2m_field_names(Shelter)

        self.assertIsInstance(result, set)

    def test_non_m2m_fields_excluded(self) -> None:
        """Scalar fields like 'name' and 'status' are not included."""
        result = _get_m2m_field_names(Shelter)

        self.assertNotIn("name", result)
        self.assertNotIn("status", result)


class ParseLocationTestCase(TestCase):
    """Tests for _parse_location."""

    def test_none_returns_none(self) -> None:
        """Passing None returns None."""
        self.assertIsNone(_parse_location(None))

    def test_empty_dict_returns_none(self) -> None:
        """An empty dict is falsy, so _parse_location returns None."""
        self.assertIsNone(_parse_location({}))

    def test_full_location_dict(self) -> None:
        """A fully-populated dict is converted to a Places instance."""
        data = {"place": "123 Main St", "latitude": 34.05, "longitude": -118.25}
        result = _parse_location(data)
        self.assertIsInstance(result, Places)
        self.assertEqual(result.place, "123 Main St")
        self.assertEqual(result.latitude, Decimal("34.05"))
        self.assertEqual(result.longitude, Decimal("-118.25"))

    def test_latitude_longitude_stored_as_decimal(self) -> None:
        """Numeric latitude/longitude are stored as Decimal by Places."""
        result = _parse_location({"latitude": 33.9, "longitude": -118.1})
        self.assertIsInstance(result.latitude, Decimal)
        self.assertIsInstance(result.longitude, Decimal)


class SetM2mFromEnumsTestCase(TestCase):
    """Tests for _set_m2m_from_enums."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")

    def test_sets_m2m_from_enum_instances(self) -> None:
        """Enum instances are resolved to their string values and linked."""
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN]})
        self.assertEqual(self.shelter.demographics.count(), 1)
        first = self.shelter.demographics.first()
        self.assertIsNotNone(first)
        assert first is not None
        self.assertEqual(first.name, DemographicChoices.SINGLE_MEN)

    def test_sets_m2m_from_raw_strings(self) -> None:
        """Raw string values (no .value attribute) are also handled."""
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.FAMILIES.value]})
        self.assertEqual(self.shelter.demographics.count(), 1)
        first = self.shelter.demographics.first()
        self.assertIsNotNone(first)
        assert first is not None
        self.assertEqual(first.name, DemographicChoices.FAMILIES)

    def test_empty_list_clears_field(self) -> None:
        """Passing an empty list removes all existing relations."""
        demo, _ = Demographic.objects.get_or_create(name=DemographicChoices.SENIORS)
        self.shelter.demographics.add(demo)
        self.assertEqual(self.shelter.demographics.count(), 1)

        _set_m2m_from_enums(self.shelter, {"demographics": []})
        self.assertEqual(self.shelter.demographics.count(), 0)

    def test_multiple_values_set_correctly(self) -> None:
        """Multiple enum values all get linked."""
        _set_m2m_from_enums(
            self.shelter,
            {"demographics": [DemographicChoices.SINGLE_MEN, DemographicChoices.SINGLE_WOMEN]},
        )
        names = set(self.shelter.demographics.values_list("name", flat=True))
        self.assertEqual(names, {DemographicChoices.SINGLE_MEN, DemographicChoices.SINGLE_WOMEN})

    def test_get_or_create_does_not_duplicate(self) -> None:
        """Calling twice with the same values does not create duplicate lookup rows."""
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.ALL]})
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.ALL]})
        self.assertEqual(Demographic.objects.filter(name=DemographicChoices.ALL).count(), 1)

    def test_multiple_fields_set_independently(self) -> None:
        """Different M2M fields in the same call are all handled."""
        _set_m2m_from_enums(
            self.shelter,
            {
                "demographics": [DemographicChoices.SENIORS],
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE],
            },
        )
        self.assertEqual(self.shelter.demographics.count(), 1)
        self.assertEqual(self.shelter.accessibility.count(), 1)

    def test_replaces_existing_values(self) -> None:
        """Calling again with different values replaces, not appends, existing relations."""
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN]})
        _set_m2m_from_enums(self.shelter, {"demographics": [DemographicChoices.FAMILIES]})
        names = set(self.shelter.demographics.values_list("name", flat=True))
        self.assertEqual(names, {DemographicChoices.FAMILIES})


class PrepareShelterDataTestCase(TestCase):
    """Tests for _prepare_shelter_data."""

    def _shelter_m2m_fields(self) -> set:
        return _get_m2m_field_names(Shelter)

    def test_m2m_fields_removed_from_scalar_data(self) -> None:
        """M2M fields are popped out of the dict and returned separately."""
        data = {"name": "Test", "demographics": [DemographicChoices.ALL]}
        scalar, m2m, schedules = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertNotIn("demographics", scalar)
        self.assertIn("demographics", m2m)
        self.assertEqual(m2m["demographics"], [DemographicChoices.ALL])

    def test_schedules_extracted(self) -> None:
        """Schedules list is popped and returned as third tuple element."""
        schedule_entry = {"schedule_type": ScheduleTypeChoices.OPERATING, "days": [DayOfWeekChoices.MONDAY]}
        data = {"name": "Test", "schedules": [schedule_entry]}
        scalar, m2m, schedules = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertNotIn("schedules", scalar)
        self.assertEqual(len(schedules), 1)
        self.assertEqual(schedules[0], schedule_entry)

    def test_schedules_defaults_to_empty_list(self) -> None:
        """Missing 'schedules' key results in an empty list."""
        data = {"name": "Test"}
        _, _, schedules = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertEqual(schedules, [])

    def test_location_parsed_to_places(self) -> None:
        """A 'location' dict is converted to a Places instance in scalar data."""
        data = {"location": {"place": "Downtown LA", "latitude": 34.05, "longitude": -118.25}}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertIsInstance(scalar["location"], Places)

    def test_location_none_becomes_none(self) -> None:
        """location=None results in None in scalar data."""
        data = {"location": None}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertIsNone(scalar["location"])

    def test_organization_converted_to_fk_id(self) -> None:
        """'organization' value is moved to 'organization_id'."""
        data = {"organization": 42}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertNotIn("organization", scalar)
        self.assertEqual(scalar["organization_id"], 42)

    def test_organization_absent_leaves_no_fk(self) -> None:
        """Missing 'organization' key means 'organization_id' is not added."""
        data = {"name": "Test"}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertNotIn("organization_id", scalar)

    def test_status_enum_converted_to_string(self) -> None:
        """A status enum is replaced with its raw string value."""
        data = {"status": StatusChoices.APPROVED}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertEqual(scalar["status"], StatusChoices.APPROVED.value)

    def test_status_none_key_removed(self) -> None:
        """status=None removes the key entirely from scalar data."""
        data = {"status": None}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertNotIn("status", scalar)

    def test_scalar_fields_preserved(self) -> None:
        """Plain scalar fields pass through unchanged."""
        data = {"name": "My Shelter", "total_beds": 50}
        scalar, _, _ = _prepare_shelter_data(data, self._shelter_m2m_fields())
        self.assertEqual(scalar["name"], "My Shelter")
        self.assertEqual(scalar["total_beds"], 50)


class CreateSchedulesTestCase(TestCase):
    """Tests for _create_schedules."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")

    def test_empty_list_creates_no_schedules(self) -> None:
        """Calling with an empty list is a no-op."""
        _create_schedules(self.shelter, [])
        self.assertEqual(Schedule.objects.filter(shelter=self.shelter).count(), 0)

    def test_single_entry_without_days_creates_one_row(self) -> None:
        """An entry with no 'days' key creates a single Schedule with day=None."""
        _create_schedules(
            self.shelter,
            [{"start_time": datetime.time(9, 0), "end_time": datetime.time(17, 0)}],
        )
        schedules = Schedule.objects.filter(shelter=self.shelter)
        self.assertEqual(schedules.count(), 1)
        first = schedules.first()
        self.assertIsNotNone(first)
        assert first is not None
        self.assertIsNone(first.day)

    def test_entry_with_multiple_days_fans_out(self) -> None:
        """An entry with N days creates N Schedule rows."""
        days = [DayOfWeekChoices.MONDAY, DayOfWeekChoices.WEDNESDAY, DayOfWeekChoices.FRIDAY]
        _create_schedules(self.shelter, [{"days": days}])
        self.assertEqual(Schedule.objects.filter(shelter=self.shelter).count(), 3)

    def test_created_days_match_input(self) -> None:
        """Each created Schedule has the correct day value."""
        days = [DayOfWeekChoices.TUESDAY, DayOfWeekChoices.THURSDAY]
        _create_schedules(self.shelter, [{"days": days}])
        created_days = set(Schedule.objects.filter(shelter=self.shelter).values_list("day", flat=True))
        self.assertEqual(created_days, {DayOfWeekChoices.TUESDAY.value, DayOfWeekChoices.THURSDAY.value})

    def test_default_schedule_type_is_operating(self) -> None:
        """Missing schedule_type defaults to OPERATING."""
        _create_schedules(self.shelter, [{}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertEqual(schedule.schedule_type, ScheduleTypeChoices.OPERATING)

    def test_schedule_type_set_from_enum(self) -> None:
        """Explicit schedule_type enum is stored correctly."""
        _create_schedules(self.shelter, [{"schedule_type": ScheduleTypeChoices.INTAKE}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertEqual(schedule.schedule_type, ScheduleTypeChoices.INTAKE)

    def test_condition_set_from_enum(self) -> None:
        """Condition enum is stored on the created row."""
        _create_schedules(self.shelter, [{"condition": ConditionChoices.HEAT}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertEqual(schedule.condition, ConditionChoices.HEAT)

    def test_condition_absent_is_none(self) -> None:
        """Missing condition results in None on the row."""
        _create_schedules(self.shelter, [{}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertIsNone(schedule.condition)

    def test_is_exception_default_false(self) -> None:
        """is_exception defaults to False when not provided."""
        _create_schedules(self.shelter, [{}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertFalse(schedule.is_exception)

    def test_is_exception_set_true(self) -> None:
        """is_exception=True is stored correctly."""
        _create_schedules(self.shelter, [{"is_exception": True}])
        schedule = Schedule.objects.get(shelter=self.shelter)
        self.assertTrue(schedule.is_exception)

    def test_times_and_dates_stored(self) -> None:
        """start_time, end_time, start_date and end_date are persisted."""
        _create_schedules(
            self.shelter,
            [
                {
                    "start_time": datetime.time(8, 0),
                    "end_time": datetime.time(20, 0),
                    "start_date": datetime.date(2025, 1, 1),
                    "end_date": datetime.date(2025, 1, 31),
                }
            ],
        )
        s = Schedule.objects.get(shelter=self.shelter)
        self.assertEqual(s.start_time, datetime.time(8, 0))
        self.assertEqual(s.end_time, datetime.time(20, 0))
        self.assertEqual(s.start_date, datetime.date(2025, 1, 1))
        self.assertEqual(s.end_date, datetime.date(2025, 1, 31))

    def test_multiple_entries_all_created(self) -> None:
        """Multiple schedule entries in the list are all persisted."""
        _create_schedules(
            self.shelter,
            [
                {"schedule_type": ScheduleTypeChoices.OPERATING},
                {"schedule_type": ScheduleTypeChoices.INTAKE},
            ],
        )
        self.assertEqual(Schedule.objects.filter(shelter=self.shelter).count(), 2)

    def test_enum_value_strings_accepted(self) -> None:
        """Raw string values (enum .value) work the same as enum instances."""
        _create_schedules(
            self.shelter,
            [
                {
                    "schedule_type": ScheduleTypeChoices.MEAL_SERVICE.value,
                    "days": [DayOfWeekChoices.SATURDAY.value],
                }
            ],
        )
        s = Schedule.objects.get(shelter=self.shelter)
        self.assertEqual(s.schedule_type, ScheduleTypeChoices.MEAL_SERVICE)
        self.assertEqual(s.day, DayOfWeekChoices.SATURDAY)


class ValidateSubsetAttributesTestCase(TestCase):
    """Tests for _validate_subset_attributes."""

    def setUp(self) -> None:
        self.shelter = Shelter.objects.create(name="Test Shelter")
        allowed_demographic, _ = Demographic.objects.get_or_create(name=DemographicChoices.SINGLE_MEN)
        self.shelter.demographics.add(allowed_demographic)
        allowed_accessibility, _ = Accessibility.objects.get_or_create(name=AccessibilityChoices.WHEELCHAIR_ACCESSIBLE)
        self.shelter.accessibility.add(allowed_accessibility)

    def test_valid_subset_passes(self) -> None:
        """Providing values that are all on the shelter raises no error."""
        _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN]})

    def test_multiple_valid_fields_pass(self) -> None:
        """Multiple common fields, each a valid subset, raises no error."""
        _validate_subset_attributes(
            self.shelter,
            {
                "demographics": [DemographicChoices.SINGLE_MEN],
                "accessibility": [AccessibilityChoices.WHEELCHAIR_ACCESSIBLE],
            },
        )

    def test_invalid_value_raises_validation_error(self) -> None:
        """A value not on the shelter raises ValidationError."""
        with self.assertRaises(ValidationError) as ctx:
            _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.FAMILIES]})
        self.assertIn("demographics", ctx.exception.message_dict)

    def test_mix_of_valid_and_invalid_raises(self) -> None:
        """Even one invalid value in the list raises ValidationError."""
        with self.assertRaises(ValidationError) as ctx:
            _validate_subset_attributes(
                self.shelter,
                {"demographics": [DemographicChoices.SINGLE_MEN, DemographicChoices.SENIORS]},
            )
        self.assertIn("demographics", ctx.exception.message_dict)

    def test_empty_list_skips_validation(self) -> None:
        """An empty list for a field is skipped — no error raised."""
        _validate_subset_attributes(self.shelter, {"demographics": []})

    def test_missing_field_key_is_skipped(self) -> None:
        """Fields absent from m2m_data are not validated."""
        _validate_subset_attributes(self.shelter, {})

    def test_field_not_in_common_m2m_fields_is_ignored(self) -> None:
        """Keys that are not in _COMMON_M2M_FIELDS are silently ignored."""
        _validate_subset_attributes(self.shelter, {"shelter_types": ["building"]})

    def test_raw_string_values_are_accepted(self) -> None:
        """Raw strings (as opposed to enum instances) work via getattr(v, 'value', v)."""
        _validate_subset_attributes(self.shelter, {"demographics": [DemographicChoices.SINGLE_MEN.value]})
