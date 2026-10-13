"""Add a simplified display copy of each boundary (DEV-2570 / DEV-2604).

The map was serving ``Region.geom`` at full resolution: 21 MB across the six
dimensions, 9,960 kB of it ZIP polygons whose finest detail renders at 0.2 px on
screen. Simplifying in the query fixed the payload (817 kB) but cost ~310 ms on
every map load, so it belongs at import time instead.

Existing rows are backfilled here with the same tolerance the importer uses, in SQL,
so a database that already has boundaries does not serve full-resolution geometry
until someone happens to re-import. ``preserve_topology`` is not optional: a plain
simplify can drop a ring or produce a self-intersection, which the Maps renderer
rejects.

Deliberately **not** derived from ``regions_regionpiece``. Subdivision clips parts at
subdivision boundaries, so reassembling pieces does not reproduce the parent —
measured, only 334 of 431 imported regions come back geometrically equal. It is the
authoritative ``geom`` that must be simplified.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.db import migrations

# Must match regions.models.DISPLAY_SIMPLIFY_DEGREES. Repeated rather than imported
# because a migration has to keep describing the schema and data it applied, even if
# the constant is later retuned.
TOLERANCE = 0.0005


def backfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    Region = apps.get_model("regions", "Region")
    if not Region.objects.exists():
        return
    schema_editor.execute(
        """
        UPDATE regions_region
        SET geom_display = ST_Multi(
            ST_SimplifyPreserveTopology(geom, %s)
        )
        WHERE geom IS NOT NULL
        """,
        [TOLERANCE],
    )


def unbackfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Dropping the derived copy is safe; it is rebuilt from ``geom``."""
    schema_editor.execute("UPDATE regions_region SET geom_display = NULL")


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0004_provenance_and_zip_kind"),
    ]

    operations = [
        migrations.AddField(
            model_name="region",
            name="geom_display",
            field=MultiPolygonField(null=True, blank=True, srid=4326),
        ),
        migrations.RunPython(backfill, unbackfill),
    ]
