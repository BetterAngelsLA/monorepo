"""The Region schema: boundaries, subdivided lookup, and resolved assignments.

One migration. This app has never been deployed, so there is no schema history to
preserve — see ``regions/models.py`` for what the three tables are for.

**No ``CreateExtension("postgis")``.** The extension is already present: ``clients``,
``common``, ``hmis`` and ``shelters`` each created geometry columns in their own
initial migrations, and PostGIS cannot create those columns without it. Worse, it
would be a deploy hazard — PostGIS is not a trusted extension, so
``CREATE EXTENSION postgis`` needs superuser or ``rds_superuser``, and on RDS the
application connects with an IAM-minted token for a non-superuser role. Its reverse
migration would also ``DROP EXTENSION`` out from under those four apps.

The backfill at the end is for a database that already has boundaries and wants the
derived tables populated without re-running the importer. On a fresh one it is a
no-op, because there is nothing to derive from.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.db import migrations, models
import django.db.models.deletion


def backfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Populate the derived tables from whatever boundaries already exist.

    Order matters: pieces before assignments, because the assignment builder reads
    pieces; display geometry alongside pieces, because both derive from ``Region``.

    Each step is idempotent — ``build_region_pieces`` deletes before inserting, the
    display update is total, and ``ensure_location_regions(force=True)`` clears first
    — so a half-applied run is safe to repeat.
    """
    from regions.models import DISPLAY_SIMPLIFY_DEGREES
    from regions.services import build_region_pieces, ensure_location_regions

    build_region_pieces()
    # The tolerance is the model's constant, not a literal. It was `0.0005` here and
    # `DISPLAY_SIMPLIFY_DEGREES` in `import_regions`, so changing the constant would have
    # left every already-migrated database simplified at the old tolerance with nothing to
    # say so.
    schema_editor.execute(
        """
        UPDATE regions_region
        SET geom_display = ST_Multi(ST_SimplifyPreserveTopology(geom, %s))
        WHERE geom IS NOT NULL
        """,
        [DISPLAY_SIMPLIFY_DEGREES],
    )
    ensure_location_regions(force=True)


def unbackfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Derived data. Dropping it is safe; the importer rewrites it."""
    apps.get_model("regions", "RegionPiece").objects.all().delete()
    apps.get_model("regions", "LocationRegion").objects.all().delete()
    apps.get_model("regions", "Region").objects.all().update(geom_display=None)


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("common", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Region",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("source_url", models.URLField(blank=True, default="", max_length=1024)),
                ("source_vintage", models.CharField(blank=True, default="", max_length=32)),
                ("source_attribution", models.TextField(blank=True, default="")),
                ("source_item_id", models.CharField(blank=True, default="", max_length=64)),
                ("geom", MultiPolygonField(srid=4326)),
                ("geom_display", MultiPolygonField(blank=True, null=True, srid=4326)),
            ],
            options={
                "ordering": ["kind", "code"],
                "constraints": [
                    models.UniqueConstraint(fields=("kind", "code"), name="regions_region_kind_code_uniq")
                ],
            },
        ),
        migrations.CreateModel(
            name="RegionPiece",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "region",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pieces",
                        to="regions.region",
                    ),
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
                ("geom", MultiPolygonField(srid=4326)),
            ],
        ),
        migrations.CreateModel(
            name="LocationRegion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
