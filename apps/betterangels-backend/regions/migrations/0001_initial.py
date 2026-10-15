"""The Region schema: boundaries and the subdivided point-lookup geometry.

One migration. This app has never been deployed, so there is no schema history to
preserve — see ``regions/models.py`` for what the two live tables are for. This revision
also declares ``LocationRegion``, a point→region crosswalk that
``0004_region_lookup_view`` deletes; the app has never been deployed, so the history is
kept rather than rewritten.

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
    """Populate the lookup geometry and the display geometry from existing boundaries.

    **Self-contained SQL, deliberately — and the reason is a bug this file shipped.** It used
    to call ``regions.services.build_region_pieces`` and ``ensure_location_regions``, i.e. live
    module state. A later revision deleted the second of those, which turned this migration
    into an ``ImportError`` on every *fresh* database while every test run stayed green under
    ``--reuse-db``, because an already-applied migration is never re-run. A migration is a
    historical document: it describes the schema as it was, and it must not call code that
    describes the schema as it is. The subdivision parameters and the tolerance are therefore
    literals here, frozen at the values ``models`` held at the time.

    The order matters only in that both statements read ``regions_region``, which this
    migration has just created; on a fresh database both are no-ops, because there is nothing
    to derive from. It exists for a database that already has boundaries and wants the lookup
    geometry populated without re-running the importer.

    ``kind`` is inserted because the column exists at this point in the history —
    ``0004_region_lookup_view`` is what drops it.
    """
    schema_editor.execute(
        """
        INSERT INTO regions_regionpiece (region_id, kind, geom, created_at, updated_at)
        SELECT r.id,
               r.kind,
               ST_Multi(COALESCE(CASE WHEN ST_NPoints(r.geom) > 2000 THEN p.geom END, r.geom)),
               NOW(),
               NOW()
        FROM regions_region r
        LEFT JOIN LATERAL ST_Subdivide(r.geom, 256) AS p(geom)
               ON ST_NPoints(r.geom) > 2000
        """
    )
    schema_editor.execute(
        """
        UPDATE regions_region
        SET geom_display = ST_Multi(ST_SimplifyPreserveTopology(geom, %s))
        WHERE geom IS NOT NULL
        """,
        [0.0005],
    )


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
