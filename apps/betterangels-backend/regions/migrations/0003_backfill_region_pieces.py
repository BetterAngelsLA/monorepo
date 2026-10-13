"""Backfill RegionPiece for regions that already exist (DEV-2570 / DEV-2604).

``0002`` created the pieces table but deliberately left it empty: subdividing every
loaded dimension inside the deploy transaction is exactly the operation the heavy
layers are too slow for. That left a trap — on a database that already has
regions, the rollup joins ``regions_regionpiece``, so until pieces exist every
dimension reports 100% "Unassigned". Nothing detects it, because the buckets still
reconcile to the total: they merely all land in the NULL bucket.

This closes the window. It runs the same builder the importer uses, which is
set-returning SQL rather than Python, so the cost is one statement per dimension.
Measured on the real LA layers: 33k vertices across 15 council districts, 148k
across 5 supervisorial districts, ~310k for the city layer.

If this proves too slow for a given environment, the operational equivalent is to
migrate normally and then run, per dimension:

    python manage.py shell -c "from regions.models import build_region_pieces; build_region_pieces()"

which does the same work outside the deploy transaction. ``Region.save`` also
repairs individual rows created afterwards, but it only covers new rows — it
cannot fix a table that was already populated.
"""

from django.db import migrations


def backfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    # Imported from the live module, not the historical model: the builder is
    # hand-written SQL against the current table names, and the migration's job is
    # to run that same statement.
    from regions.models import build_region_pieces

    build_region_pieces()


def unbackfill(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Pieces are derived data — dropping them is safe and reversible."""
    RegionPiece = apps.get_model("regions", "RegionPiece")
    RegionPiece.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0002_regionpiece"),
    ]

    operations = [
        migrations.RunPython(backfill, unbackfill),
    ]
