"""The point-lookup view, and the removal of the stored crosswalk.

Three changes, one decision.

**``LocationRegion`` is deleted.** It stored "which region each location falls in, per
dimension", resolved once and rebuilt whenever boundaries moved. The rollup now does that
join live, written boundaries-first, so it probes the GiST index on ``Location.point_geom``
(added in ``common/0002``). Measured on the real LA layers, all six dimensions:

    interactions      live join     stored crosswalk
        20,000           45 ms            22 ms
       500,000          210 ms           211 ms

The live join's cost tracks *distinct locations*, not interactions, so it converges on the
crosswalk as a report window grows — and at the fixture's 20,000 interactions it is 2x
rather than the ~4x the mirror query costs. What that buys is the
removal of a derived table, its service, its management command, its migration backfill and
its staleness class — and of a write performed from the read path on every report load.

**``RegionPiece.kind`` is deleted.** The rollup joins ``Region`` anyway to read the code, so
the denormalised copy bought nothing and could disagree with its parent.

**``regions_regionlookup`` is created.** It is the surface the rollup and the map's region
filter both read: each region's subdivided pieces, plus the parent boundary for a region
that has no piece. The fallback lives here, once, instead of in every query. The importer
writes at least one piece per region, so in practice the second arm is empty — the
anti-join over 431 regions measures 0.27 ms.

Why the read direction matters, since it is what makes this affordable: the lookup polygons
drive and the points are probed. The mirror query — "for each interaction, find its region"
— measures 200 ms for the same result, and 4,950 ms with no subdivision at all.

**This view is also what keeps the planner in that direction.** Pointed straight at
``regions_regionpiece``, the planner flips the join round on a selective window and drives
from the notes: 100 ms for a 2,041-interaction window against 30 ms through the view. It is
not only a place to keep the piece-less fallback, it is the relation shape the good plan
needs.
"""

from django.db import migrations, models

LOOKUP_VIEW = "regions_regionlookup"

# `UNION ALL`, not `UNION`: the two arms are disjoint by the anti-join, so de-duplicating
# would be a sort for nothing. The view exposes no primary key, which is why it is read
# through `selectors`' raw SQL rather than an ORM model.
CREATE_LOOKUP_VIEW = f"""
CREATE VIEW {LOOKUP_VIEW} AS
    SELECT p.region_id, p.geom
    FROM regions_regionpiece p
    UNION ALL
    SELECT r.id AS region_id, r.geom
    FROM regions_region r
    WHERE NOT EXISTS (SELECT 1 FROM regions_regionpiece q WHERE q.region_id = r.id)
"""

DROP_LOOKUP_VIEW = f"DROP VIEW IF EXISTS {LOOKUP_VIEW}"


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0003_alter_region_options"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="locationregion",
            name="unique_location_kind_assignment",
        ),
        migrations.RemoveField(
            model_name="regionpiece",
            name="kind",
        ),
        # `db_index=True` on a CharField also creates a `varchar_pattern_ops` twin for
        # prefix `LIKE`s, which nothing in this app performs. Dropping the flag and
        # declaring one index by name is what turns two indexes into one.
        migrations.AlterField(
            model_name="region",
            name="kind",
            field=models.CharField(
                choices=[
                    ("zip", "ZIP Code"),
                    ("city", "City"),
                    ("council_district", "City Council District"),
                    ("supervisorial_district", "Supervisorial District"),
                    ("spa", "Service Planning Area"),
                    ("coc", "Continuum of Care"),
                ],
                max_length=32,
            ),
        ),
        migrations.AddIndex(
            model_name="region",
            index=models.Index(fields=["kind"], name="regions_region_kind_idx"),
        ),
        migrations.DeleteModel(
            name="LocationRegion",
        ),
        migrations.RunSQL(CREATE_LOOKUP_VIEW, DROP_LOOKUP_VIEW),
    ]
