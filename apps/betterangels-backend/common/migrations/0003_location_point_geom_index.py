"""The GiST index on ``Location.point_geom``, built **concurrently**.

Split out of ``0002`` deliberately. ``0002`` already takes an ``ACCESS EXCLUSIVE`` lock to
rewrite ``common_location`` for the generated column, and a plain ``CREATE INDEX`` would take a
second one while it scans the whole table — two long lock windows on a user-facing table, in one
deployment. ``CREATE INDEX CONCURRENTLY`` does not block writes, so the index build can happen
alongside traffic.

Two consequences of that, both intentional:

* the migration is **non-atomic** (``atomic = False``) — ``CREATE INDEX CONCURRENTLY`` cannot run
  inside a transaction block, and a failed concurrent build leaves an *invalid* index behind
  rather than rolling back. Dropping and re-running this migration is the fix if that happens;
* the index is created unconditionally, so it fails if an index of this name already exists.
  ``common/0002`` is the only other place that could create it, and it does not.
"""

from django.contrib.postgres.indexes import GistIndex
from django.contrib.postgres.operations import AddIndexConcurrently
from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("common", "0002_location_point_geom"),
    ]

    operations = [
        # `GistIndex`, not a plain `Index`: PostGIS indexes geometry with GiST, and the rollup's
        # `ST_Covers` carries an index condition of the form `point_geom @ lu.geom` that only a
        # GiST index can answer.
        AddIndexConcurrently(
            model_name="location",
            index=GistIndex(fields=["point_geom"], name="common_location_point_geom_gix"),
        ),
    ]
