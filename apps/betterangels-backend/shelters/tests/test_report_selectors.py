"""Unit tests for the shelter reporting selectors (average days to occupancy).

Bed history is normally written by database triggers using the real SQL
``NOW()``, which ``time_machine`` cannot backdate.  To exercise historical date
ranges we therefore clear the auto-generated events and insert ``BedEvent`` rows
directly, overriding the ``auto_now_add`` ``pgh_created_at`` via ``.update()``.

Event timestamps are built directly in UTC at exact day offsets so durations are
whole numbers of days regardless of daylight-saving transitions.
"""

import datetime

import pytest
from clients.enums import GenderEnum
from django.apps import apps
from model_bakery import baker
from shelters.enums import BedStatusChoices, DemographicChoices
from shelters.models import Bed, Demographic
from shelters.selectors import _report_date_range_to_utc, avg_days_to_occupancy
from shelters.tests.baker_recipes import shelter_recipe

UTC = datetime.timezone.utc

# A fixed window comfortably containing every offset used below.
BASE = datetime.datetime(2025, 4, 1, 12, 0, tzinfo=UTC)
RANGE_START = datetime.date(2025, 4, 1)
RANGE_END = datetime.date(2025, 6, 15)


def _utc(offset_days: float) -> datetime.datetime:
    """A UTC instant ``offset_days`` after the window's base time."""
    return BASE + datetime.timedelta(days=offset_days)


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


def _avg(shelter, **kwargs):
    return avg_days_to_occupancy(
        shelter_id=shelter.id, start_date=RANGE_START, end_date=RANGE_END, **kwargs
    )


@pytest.mark.django_db
def test_report_date_range_rejects_oversized():
    with pytest.raises(ValueError):
        _report_date_range_to_utc(datetime.date(2024, 1, 1), datetime.date(2025, 12, 31))


@pytest.mark.django_db
def test_avg_days_matches_worked_example(shelter):
    """Bed 1: 7d; Bed 2: 21d + 5d; Bed 3: 5d + 3d -> (7+21+5+5+3)/5 = 8.2."""
    bed1 = Bed.objects.create(shelter=shelter)
    bed2 = Bed.objects.create(shelter=shelter)
    bed3 = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Bed 1 -> single 7-day gap.
    _bed_event(bed1, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(bed1, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(7))

    # Bed 2 -> 21-day then 5-day gaps.
    _bed_event(bed2, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(bed2, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(21))
    _bed_event(bed2, label="bed.status_change", status=BedStatusChoices.AVAILABLE, when=_utc(25))
    _bed_event(bed2, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(30))

    # Bed 3 -> 5-day then 3-day gaps.
    _bed_event(bed3, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(bed3, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(5))
    _bed_event(bed3, label="bed.status_change", status=BedStatusChoices.AVAILABLE, when=_utc(8))
    _bed_event(bed3, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(11))

    assert _avg(shelter) == 8.2


@pytest.mark.django_db
def test_occupied_from_creation_is_excluded(shelter):
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Created already occupied with no later status changes -> no unoccupied
    # period precedes any occupancy event.
    _bed_event(bed, label="bed.add", status=BedStatusChoices.OCCUPIED, when=_utc(0))

    assert _avg(shelter) is None


@pytest.mark.django_db
def test_occupancy_event_outside_range_is_excluded(shelter):
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Both the unoccupied and occupied events pre-date the range start.
    _bed_event(bed, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(-10))
    _bed_event(bed, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(-3))

    assert _avg(shelter) is None


@pytest.mark.django_db
def test_preceding_unoccupied_event_may_predate_range(shelter):
    bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Unoccupied before the range, occupied inside it: a 4-day gap still counts.
    _bed_event(bed, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(-2))
    _bed_event(bed, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(2))

    assert _avg(shelter) == 4.0


@pytest.mark.django_db
def test_no_events_returns_none(shelter):
    Bed.objects.create(shelter=shelter)
    _clear_events()

    assert _avg(shelter) is None


@pytest.mark.django_db
def test_bed_filters_restrict_considered_beds(shelter):
    seniors, _ = Demographic.objects.get_or_create(name=DemographicChoices.SENIORS)
    senior_bed = Bed.objects.create(shelter=shelter)
    senior_bed.demographics.add(seniors)
    other_bed = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Seniors bed: 4-day gap. Other bed: 10-day gap.
    _bed_event(senior_bed, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(senior_bed, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(4))
    _bed_event(other_bed, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(other_bed, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(10))

    assert _avg(shelter, bed_filters={"demographics": [DemographicChoices.SENIORS]}) == 4.0


@pytest.mark.django_db
def test_client_filters_restrict_qualifying_events(shelter):
    female_client = baker.make("clients.ClientProfile", gender=GenderEnum.FEMALE)
    male_client = baker.make("clients.ClientProfile", gender=GenderEnum.MALE)
    bed_f = Bed.objects.create(shelter=shelter)
    bed_m = Bed.objects.create(shelter=shelter)
    _clear_events()

    # Female-occupied bed: 6-day gap. Male-occupied bed: 2-day gap.
    _bed_event(bed_f, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(bed_f, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(6), occupant=female_client)
    _bed_event(bed_m, label="bed.add", status=BedStatusChoices.AVAILABLE, when=_utc(0))
    _bed_event(bed_m, label="bed.status_change", status=BedStatusChoices.OCCUPIED, when=_utc(2), occupant=male_client)

    assert _avg(shelter, client_filters={"gender": GenderEnum.FEMALE}) == 6.0
