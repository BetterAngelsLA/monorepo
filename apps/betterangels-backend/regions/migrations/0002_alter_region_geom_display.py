"""Make ``Region.geom_display`` a generated column.

The database derives it from ``geom``, so there is no backfill to run, nothing for
``import_regions`` to keep in step, and no way for it to drift.

**The tolerance is frozen here; the helper is imported.** Reading it from the model would mean
that changing ``DISPLAY_SIMPLIFY_DEGREES`` silently changes what this already-applied migration
produced.

The *callable* is imported rather than redefined, though, because Django compares field
expressions by class: an inline copy is a different class, so the autodetector reads it as a
perpetual pending change and ``makemigrations --check`` never goes green.
"""

import django.contrib.gis.db.models.fields
from django.db import migrations, models

from regions.models import SimplifyPreserveTopology

#: The tolerance this migration writes. Deliberately *not* imported from the model — see the
#: module docstring. It matches ``models.DISPLAY_SIMPLIFY_DEGREES``.
TOLERANCE = 0.0005


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0001_initial"),
    ]

    operations = [
        # Drop-then-add rather than AlterField: converting a plain column into a generated one
        # has to re-evaluate every row, and Postgres computes a STORED generated column only on
        # INSERT/UPDATE — an in-place ALTER would leave existing rows NULL. Re-adding the column
        # is what makes Postgres recompute them; `geom` is untouched, so nothing is lost.
        migrations.RemoveField(model_name="region", name="geom_display"),
        migrations.AddField(
            model_name="region",
            name="geom_display",
            field=models.GeneratedField(
                db_persist=True,
                expression=SimplifyPreserveTopology(models.F("geom"), models.Value(TOLERANCE)),
                output_field=django.contrib.gis.db.models.fields.MultiPolygonField(null=True, srid=4326),
            ),
        ),
    ]
