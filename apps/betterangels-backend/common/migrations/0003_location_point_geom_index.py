"""The GiST index on ``Location.point_geom``, built **concurrently** and only if absent.

``0002`` already takes an ``ACCESS EXCLUSIVE`` lock to rewrite ``common_location`` for the
generated column, and a plain ``CREATE INDEX`` would take a second one while it scans the whole
table — two long lock windows on a user-facing table, in one deployment. ``CREATE INDEX
CONCURRENTLY`` does not block writes, so the index build can happen alongside traffic.

**``IF NOT EXISTS`` is load-bearing here, not defensive.** Databases are not in one state with
respect to this index: one has neither the column nor the index, another has both and records
``common/0002`` as applied, and a migration that has run is not re-run. An unconditional
``CREATE INDEX`` — what ``AddIndexConcurrently`` emits — aborts wherever the index already
exists, and folding the index into ``0002`` cannot create it wherever ``0002`` has already run.
A conditional statement in this migration is the only form that serves every state.

Two consequences of the concurrent build, both intentional:

* the migration is **non-atomic** (``atomic = False``) — ``CREATE INDEX CONCURRENTLY`` cannot run
  inside a transaction block, and a failed concurrent build leaves an *invalid* index behind
  rather than rolling back. Dropping and re-running this migration is the fix if that happens;
* the index reaches Django's migration state through ``SeparateDatabaseAndState``'s
  ``state_operations``, so the autodetector still sees the model's ``GistIndex`` as applied while
  the database gets the hand-written statement rather than ``AddIndexConcurrently``'s
  unconditional one.
"""

from django.contrib.postgres.indexes import GistIndex
from django.db import migrations


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("common", "0002_location_point_geom"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                # `GistIndex`, not a plain `Index`: PostGIS indexes geometry with GiST, and the
                # rollup's `ST_Covers` carries an index condition of the form
                # `point_geom @ lu.geom` that only a GiST index can answer. Declared here rather
                # than by `AddIndexConcurrently` so the statement below can be conditional.
                migrations.AddIndex(
                    model_name="location",
                    index=GistIndex(fields=["point_geom"], name="common_location_point_geom_gix"),
                ),
            ],
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "CREATE INDEX CONCURRENTLY IF NOT EXISTS common_location_point_geom_gix "
                        "ON common_location USING gist (point_geom);"
                    ),
                    reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS common_location_point_geom_gix;",
                ),
            ],
        ),
    ]
