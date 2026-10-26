"""Index ``Region.geom_display``, and drop the spatial index on ``geom`` that nothing probes.

**Why ``geom_display`` needs the index declared by hand.** It is a ``GeneratedField``, and
Django never auto-indexes one: ``PostGISSchemaEditor._field_should_be_indexed`` looks for
``spatial_index``, which a generated column does not carry, and falls back to ``db_index``,
which it also does not carry. Without this index every boundary tile reads every region of its
kind.

**What the index changes, measured on the loaded fixture (311 ZIP regions).** The tile
predicate is ``kind = … AND geom_display && <tile envelope>``, and which side the planner leads
with depends on how selective the envelope is:

* at a **coarse** zoom the envelope is not selective — a z8 ZIP tile genuinely contains 238 of
  the 311 polygons — so the planner scans by ``kind`` and filters the envelope, *with or
  without* this index. That is the correct plan, the opening-zoom latency is unchanged
  (3–5 ms), and this index should not be used there.
* at a **deep** zoom the envelope is selective — a z14 ZIP tile intersects ~18 of 311 — and the
  planner uses this index, cutting ``Rows Removed by Filter`` from 305 to 12.

The point is not a constant-factor win at every zoom. It is that the set the query *reads*
stops scaling with the number of loaded regions of that kind: without the index every tile, at
every zoom, reads all of them. That is the cost that grows as more boundary layers are added
(CoT, ZIP+4, neighbourhoods), which is why the index stays even though the opening-zoom plan is
deliberately unchanged.

**Why ``geom``'s index goes.** It is the authoritative full-resolution boundary, and no read
puts a spatial predicate on it: the importer reads it to subdivide (a full scan), and the
admin's detail page reads it by primary key. Indexing it only costs an index rebuild on every
import.

**Both operations are in one ordinary (atomic) migration deliberately.** ``regions_region``
holds 431 rows, so the ``CREATE INDEX`` and the ``DROP INDEX`` each hold their lock for
milliseconds; splitting them into ``AddIndexConcurrently`` migrations would buy nothing and
cost the non-atomic wrapper. Re-measure before assuming that on a larger table.
"""

from django.contrib.gis.db.models.fields import MultiPolygonField
from django.contrib.postgres.indexes import GistIndex
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0004_region_lookup_view"),
    ]

    operations = [
        # Drop the unused GiST index on `geom` by altering the field's `spatial_index`.
        migrations.AlterField(
            model_name="region",
            name="geom",
            field=MultiPolygonField(srid=4326, spatial_index=False),
        ),
        # `GistIndex`, not a plain `Index`: the tile query's `geom_display && <envelope>` is a
        # bounding-box operator GiST can answer and a btree cannot. The planner chooses whether
        # to use it, and at coarse zooms it correctly does not.
        migrations.AddIndex(
            model_name="region",
            index=GistIndex(fields=["geom_display"], name="regions_region_geom_display_gix"),
        ),
    ]
