"""Data migration: convert legacy operating_hours / intake_hours TimeRangeField
values on Shelter into Schedule rows.

Each time-range pair becomes a Schedule entry with day=NULL (every day) since
the legacy fields had no per-day granularity.
"""

import datetime

from django.db import migrations


def _parse_time_ranges(raw_value):
    """Parse stored TimeRangeField text into (start_time, end_time) pairs.

    Format: "HH:MM:SS-HH:MM:SS,HH:MM:SS-HH:MM:SS,..."
    """
    if not raw_value or not raw_value.strip():
        return []
    pairs = []
    for chunk in raw_value.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        start_str, end_str = chunk.split("-")
        start_time = datetime.datetime.strptime(start_str.strip(), "%H:%M:%S").time()
        end_time = datetime.datetime.strptime(end_str.strip(), "%H:%M:%S").time()
        pairs.append((start_time, end_time))
    return pairs


def forwards(apps, schema_editor):
    Shelter = apps.get_model("shelters", "Shelter")
    Schedule = apps.get_model("shelters", "Schedule")

    mappings = [
        ("operating_hours", "operating"),
        ("intake_hours", "intake"),
    ]

    rows_to_create = []
    for shelter in Shelter.objects.all().iterator():
        for field_name, schedule_type in mappings:
            raw = getattr(shelter, field_name, None)
            for start_time, end_time in _parse_time_ranges(raw):
                rows_to_create.append(
                    Schedule(
                        shelter=shelter,
                        schedule_type=schedule_type,
                        day=None,
                        start_time=start_time,
                        end_time=end_time,
                        is_exception=False,
                    )
                )

    if rows_to_create:
        Schedule.objects.bulk_create(rows_to_create, ignore_conflicts=True)


def backwards(apps, schema_editor):
    """Reverse: delete Schedule rows that were created from legacy data.

    Only removes day=NULL, non-exception entries for operating/intake types
    that have no start_date (i.e. not manually created with date bounds).
    """
    Schedule = apps.get_model("shelters", "Schedule")
    Schedule.objects.filter(
        day__isnull=True,
        is_exception=False,
        start_date__isnull=True,
        schedule_type__in=["operating", "intake"],
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0030_add_schedule"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
