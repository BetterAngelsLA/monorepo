"""Store the location-to-region assignment, so the rollup is an ordinary join.

``region_counts`` used to work out "which region contains this point" on every read,
in a ``LATERAL`` join Django cannot express. That kept the report query in raw SQL and
made its cost scale with the notes in range rather than the locations they belong to.
This table holds the answer instead: resolved once, joined thereafter.
"""

import django.db.models.deletion
from django.db import migrations, models


def backfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Resolve existing locations against existing boundaries.

    Without this, deploying leaves the assignment table empty while ``region_counts``
    reads from it, so every dimension would report only unassigned until someone
    happened to re-import — the same trap migration 0003 had, and the same answer: do
    the work here rather than document a manual step.

    Safe on an empty database, and a no-op when no regions are loaded.
    """
    from regions.selectors import ensure_location_regions

    ensure_location_regions(force=True)


def unbackfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Derived data. Dropping it is safe; the importer rewrites it."""
    apps.get_model("regions", "LocationRegion").objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0001_initial"),
        ("regions", "0005_region_display_geometry"),
    ]

    operations = [
        migrations.CreateModel(
            name="LocationRegion",
            fields=[
                (
                    "id",
                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("zip", "ZIP Code"),
                            ("city", "City"),
                            ("council_district", "City Council District"),
                            ("supervisorial_district", "Supervisorial District"),
                            ("spa", "Service Planning Area"),
                            ("coc", "Continuum of Care"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                (
                    "location",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="region_assignments",
                        to="common.location",
                    ),
                ),
                (
                    "region",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignments",
                        to="regions.region",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(fields=("location", "kind"), name="unique_location_kind_assignment")
                ],
            },
        ),
        migrations.RunPython(backfill, unbackfill),
    ]
