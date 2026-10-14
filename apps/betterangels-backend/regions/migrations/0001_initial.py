"""The Region schema: authoritative boundaries, subdivided lookup, and derived data.

One migration, because that is what this actually is. The app has never been
deployed, so the earlier six existed only to describe a sequence of branch-local
edits — a `zcta` -> `zip` rename that every committed revision already had under its
final name, and three backfills that write nothing on a fresh database. What a reader
needs is the finished schema, not the route it took to get here.

Three tables, and the distinction between them is the design:

``Region``
    The authoritative boundary. Full resolution, one row per region per dimension.
    Used for area, exports, and anything where the real line matters. ``geom_display``
    is a simplified copy solely for the map: at 0.0005 degrees (about 46 m at Los
    Angeles) the finest detail is 0.2 px on screen, and serving the authoritative
    geometry instead shipped 21 MB across the six dimensions where 817 kB suffices.

``RegionPiece``
    Subdivided copies of the same geometry, for point lookup only. A single city
    multipolygon gives the GiST index one enormous bounding box that matches nearly
    every point in Los Angeles, so the index prunes nothing and the cost lands in the
    vertex recheck. Pieces have tight boxes. This is PostGIS's own guidance
    (https://postgis.net/documentation/faq/big-objects-performance/), and pieces keep
    the parent key as that guidance requires.

``LocationRegion``
    Which region each location falls in, resolved once rather than per request. A
    nullable ``region`` means "resolved, and in no region of this dimension" — a real
    answer, since a Beverly Hills address has no LA city council district — which is
    what lets a reader tell it apart from "not resolved yet".

**No ``CreateExtension("postgis")``.** The extension is already present: ``clients``,
``common``, ``hmis`` and ``shelters`` each created geometry columns in their own
initial migrations, and PostGIS cannot create those columns without it. Worse, it
would be a deploy hazard — PostGIS is not a trusted extension, so
``CREATE EXTENSION postgis`` needs superuser or ``rds_superuser``, and on RDS the
application connects with an IAM-minted token for a non-superuser role. The statement
could fail and block the run, for an extension that is already installed.

The backfill at the end is for a database that already has boundaries and wants the
derived tables populated without re-running the importer. On a fresh database it is a
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
    from regions.models import build_region_pieces
    from regions.selectors import ensure_location_regions

    build_region_pieces()
    schema_editor.execute(
        """
        UPDATE regions_region
        SET geom_display = ST_Multi(ST_SimplifyPreserveTopology(geom, 0.0005))
        WHERE geom IS NOT NULL
        """
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
