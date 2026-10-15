"""Drop the point→region crosswalk, drop ``RegionPiece.kind``, and add the lookup view.

**``LocationRegion`` is dropped.** The rollup computes the point→region join live instead,
written boundaries-first so it probes the GiST index on ``Location.point_geom``
(``common/0002``). On the real LA layers, all six dimensions, that join costs 45 ms over
20,000 interactions and 210 ms over 500,000 — its cost tracks *distinct locations* rather
than interactions, so a wider report window does not widen it. Nothing is stored, so the
rollup needs no derived table, no backfill and no write on the read path.

**``RegionPiece.kind`` is dropped.** The rollup joins ``Region`` to read the code anyway, so
the denormalised copy would add a second source of truth that can disagree with its parent.

**``regions_regionlookup`` is created.** It is the surface the rollup and the map's region
filter both read: each region's subdivided pieces, plus the parent boundary for a region with
no piece. The fallback lives here, once, instead of in every query. The importer writes at
least one piece per region, so in practice the second arm is empty — the anti-join over 431
regions measures 0.27 ms.

**Do not inline the view into its callers.** It is what holds the planner in the good join
direction: pointed straight at ``regions_regionpiece`` the planner flips round on a selective
window and drives from the notes — 100 ms for 2,041 interactions against 30 ms through the
view. The mirror query over the same data costs 200 ms, and 4,950 ms with no subdivision.
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
        # prefix `LIKE`s, which nothing in this app performs. One index declared by name
        # replaces both.
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
