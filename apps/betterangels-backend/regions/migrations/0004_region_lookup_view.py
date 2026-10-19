"""Drop the point→region crosswalk, drop ``RegionPiece.kind``, and add the lookup view.

**``LocationRegion`` is dropped.** The rollup computes the point→region join live, written
boundaries-first so it probes the GiST index on ``Location.point_geom`` (``common/0002``);
``selectors._assigned_counts`` carries the reasoning and the measurements.

**``RegionPiece.kind`` is dropped.** The rollup joins ``Region`` to read the code anyway, so the
denormalised copy would add a second source of truth that can disagree with its parent.

**``regions_regionlookup`` is created.** It is the surface the rollup and the map's region filter
both read: each region's subdivided pieces, plus the parent boundary for a region with no piece.
The importer writes at least one piece per region, so in practice the second arm is empty.

**Do not inline the view into its callers.** It adds back the parent boundary of a region that
has no piece, which is what keeps such a region out of the rollup's blind spot, and it gives
the rollup and the tile one relation to read. The plan-shape argument that used to be here did
not survive re-measurement: pointed straight at ``regions_regionpiece`` the planner does drive
from the notes on a small window, but measures 42 ms against 29 ms through the view at ~660
notes, and 8 ms against 28 ms at ~100. ``regions/models.py`` carries the current numbers.
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
