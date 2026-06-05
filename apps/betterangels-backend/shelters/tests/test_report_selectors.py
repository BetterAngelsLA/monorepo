"""Unit tests for the shelter reporting selectors (daily occupancy).

Bed history is normally written by database triggers using the real SQL
``NOW()``, which ``time_machine`` cannot backdate.  To exercise historical date
ranges we therefore clear the auto-generated events and insert ``BedEvent`` rows
directly, overriding the ``auto_now_add`` ``pgh_created_at`` via ``.update()``.
"""

import datetime
from zoneinfo import ZoneInfo

import pytest
from clients.enums import GenderEnum
from django.apps import apps
from model_bakery import baker
from shelters.enums import BedStatusChoices, DemographicChoices
from shelters.models import Bed, Demographic
from shelters.selectors import _report_date_range_to_utc, daily_occupancy
from shelters.tests.baker_recipes import shelter_recipe

LA_TZ = ZoneInfo("America/Los_Angeles")
UTC = datetime.timezone.utc


def _at(day: datetime.date, hour: int = 12, minute: int = 0) -> datetime.datetime:
    """Return the UTC instant for ``hour:minute`` LA-local time on ``day``."""
    return datetime.datetime(day.year, day.month, day.day, hour, minute, tzinfo=LA_TZ).astimezone(UTC)


def _bed_event(bed: Bed, *, label: str, status, when: datetime.datetime, occupant=None):
    """Create a ``BedEvent`` row with a controlled ``pgh_created_at``."""
    bed_event_model = apps.get_model("shelters", "BedEvent")
    event = bed_event_model.objects.create(
        id=bed.id,
        pgh_obj_id=bed.id,
        shelter_id=bed.shelter_id,
        pgh_label=label,
        status=status,
        occupant=occupant,
        name=bed.name,
        type=bed.type,
    )
    bed_event_model.objects.filter(pk=event.pgh_id).update(pgh_created_at=when)
    return event


def _clear_events() -> None:
    """Remove the events auto-created by triggers during bed setup."""
    apps.get_model("shelters", "BedEvent").objects.all().delete()


@pytest.fixture
def shelter():
    return shelter_recipe.make()


@pytest.fixture
def occupancy_dates():
    """A small, fixed historical window: day0 .. day3 (LA-local)."""
    day0 = datetime.date(2025, 3, 10)
    return [day0 + datetime.timedelta(days=i) for i in range(4)]


@pytest.mark.django_db
def test_report_date_range_to_utc_boundaries():
    start_utc, end_utc = _report_date_range_to_utc(datetime.date(2025, 1, 15), datetime.date(2025, 1, 15))
    # PST is UTC-8 in January, so local midnight == 08:00 UTC.
    assert start_utc == datetime.datetime(2025, 1, 15, 8, 0, tzinfo=UTC)
    assert end_utc == datetime.datetime(2025, 1, 16, 8, 0, tzinfo=UTC)


@pytest.mark.django_db
def test_report_date_range_rejects_inverted_and_oversized():
    with pytest.raises(ValueError):
        _report_date_range_to_utc(datetime.date(2025, 2, 2), datetime.date(2025, 2, 1))
    with pytest.raises(ValueError):
        _report_date_range_to_utc(datetime.date(2024, 1, 1), datetime.date(2025, 12, 31))


@pytest.mark.django_db
def test_daily_occupancy_status_changes_across_days(shelter, occupancy_dates):
    day0, day1, day2, day3 = occupancy_dates
    bed1 = Bed.objects.create(shelter=shelter)
    bed2 = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(bed1, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_at(day0, 1))
    _bed_event(bed1, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_at(day2, 9))
    _bed_event(bed2, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1))

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day3)

    assert [(r["occupied_count"], r["total_beds"], r["occupancy_pct"]) for r in result] == [
        (1, 2, 50.0),  # day0: bed1 available, bed2 occupied
        (1, 2, 50.0),  # day1: unchanged
        (2, 2, 100.0),  # day2: bed1 now occupied
        (2, 2, 100.0),  # day3: unchanged
    ]
    assert [r["date"] for r in result] == [day0, day1, day2, day3]


@pytest.mark.django_db
def test_bed_added_mid_range_only_counts_after_creation(shelter, occupancy_dates):
    day0, day1, day2, day3 = occupancy_dates
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(bed, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_at(day1, 10))
    _bed_event(bed, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_at(day2, 10))

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day3)

    assert [(r["total_beds"], r["occupied_count"]) for r in result] == [
        (0, 0),  # day0: bed not created yet
        (1, 0),  # day1: created, available
        (1, 1),  # day2: occupied
        (1, 1),  # day3: unchanged
    ]


@pytest.mark.django_db
def test_bed_removed_mid_range_drops_out(shelter, occupancy_dates):
    day0, day1, day2, day3 = occupancy_dates
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(bed, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1))
    _bed_event(bed, label="bed.remove", status=BedStatusChoices.OCCUPIED, when=_at(day2, 10))

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day3)

    assert [(r["total_beds"], r["occupied_count"]) for r in result] == [
        (1, 1),  # day0: present, occupied
        (1, 1),  # day1: present, occupied
        (0, 0),  # day2: removed
        (0, 0),  # day3: removed
    ]


@pytest.mark.django_db
def test_no_events_in_range_returns_zero_rows(shelter, occupancy_dates):
    day0, _, _, day3 = occupancy_dates
    Bed.objects.create(shelter=shelter)
    _clear_events()  # leave no events at all

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day3)

    assert len(result) == 4
    assert all(r["total_beds"] == 0 and r["occupied_count"] == 0 and r["occupancy_pct"] == 0.0 for r in result)


@pytest.mark.django_db
def test_none_status_excluded_from_percentage(shelter, occupancy_dates):
    day0, _, _, day3 = occupancy_dates
    bed_none = Bed.objects.create(shelter=shelter)
    bed_occupied = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(bed_none, label="bed.add", status=None, when=_at(day0, 1))
    _bed_event(bed_occupied, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1))

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day3)

    # The None-status bed is excluded from the denominator entirely.
    assert result[0]["total_beds"] == 1
    assert result[0]["occupied_count"] == 1
    assert result[0]["occupancy_pct"] == 100.0


@pytest.mark.django_db
def test_bed_filters_by_demographics(shelter, occupancy_dates):
    day0, _, _, day3 = occupancy_dates
    seniors, _ = Demographic.objects.get_or_create(name=DemographicChoices.SENIORS)

    senior_bed = Bed.objects.create(shelter=shelter)
    senior_bed.demographics.add(seniors)
    other_bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(senior_bed, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1))
    _bed_event(other_bed, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1))

    result = daily_occupancy(
        shelter_id=shelter.id,
        start_date=day0,
        end_date=day3,
        bed_filters={"demographics": [DemographicChoices.SENIORS]},
    )

    # Only the seniors-designated bed is in the considered universe.
    assert result[0]["total_beds"] == 1
    assert result[0]["occupied_count"] == 1


@pytest.mark.django_db
def test_client_filters_restrict_occupied_numerator(shelter, occupancy_dates):
    day0, _, _, day3 = occupancy_dates
    female_client = baker.make("clients.ClientProfile", gender=GenderEnum.FEMALE)
    male_client = baker.make("clients.ClientProfile", gender=GenderEnum.MALE)

    bed_f = Bed.objects.create(shelter=shelter)
    bed_m = Bed.objects.create(shelter=shelter)
    _clear_events()

    _bed_event(bed_f, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1), occupant=female_client)
    _bed_event(bed_m, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 1), occupant=male_client)

    result = daily_occupancy(
        shelter_id=shelter.id,
        start_date=day0,
        end_date=day3,
        client_filters={"gender": GenderEnum.FEMALE},
    )

    # Denominator keeps both beds; only the female-occupied bed counts as occupied.
    assert result[0]["total_beds"] == 2
    assert result[0]["occupied_count"] == 1
    assert result[0]["occupancy_pct"] == 50.0


@pytest.mark.django_db
def test_timezone_late_night_change_attributed_to_local_day(shelter):
    day0 = datetime.date(2025, 3, 10)
    day1 = day0 + datetime.timedelta(days=1)
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Occupied early on day0, then freed at 23:00 LA (== 06:00 UTC the next day).
    _bed_event(bed, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_at(day0, 0, 30))
    _bed_event(bed, label="bed.status_change", status=BedStatusChoices.AVAILABLE, when=_at(day0, 23, 0))

    result = daily_occupancy(shelter_id=shelter.id, start_date=day0, end_date=day1)

    # The 23:00-LA change belongs to day0; if it were mis-attributed by UTC date
    # the bed would still read occupied on day0.
    assert result[0]["occupied_count"] == 0
    assert result[0]["total_beds"] == 1
