"""Data migration: convert legacy operating_hours / intake_hours TimeRangeField
values on Shelter into Schedule rows.

Each time-range pair becomes a Schedule entry with day=NULL (every day) since
the legacy fields had no per-day granularity.
"""

from django.db import migrations


def _merge_overlapping(ranges):
    """Merge overlapping or adjacent (start_time, end_time) pairs."""
    if not ranges:
        return []
    sorted_ranges = sorted(ranges, key=lambda r: r[0])
    merged = [sorted_ranges[0]]
    for start, end in sorted_ranges[1:]:
        prev_start, prev_end = merged[-1]
        if start <= prev_end:
            merged[-1] = (prev_start, max(prev_end, end))
        else:
            merged.append((start, end))
    return merged


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
            ranges = getattr(shelter, field_name, None) or []
            for start_time, end_time in _merge_overlapping(ranges):
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
