"""A CHECK that a ``Region``'s geometry is valid, and a message on the uniqueness constraint.

**Why the CHECK.** ``import_regions`` repairs geometry with ``make_valid``, so importer-written
data is clean — but nothing stops a test, a script, or the admin from writing an invalid row,
and one is enough to take out a whole dimension's tiles. ``ST_Covers`` tolerates invalid
geometry, which is why the rollup has not surfaced it; ``ST_AsMVTGeom`` and ``ST_Intersection``
do not, and an ``ST_Intersection`` against the loaded layers fails outright with
``TopologyException: Nested shells``. ``ST_IsValid`` is IMMUTABLE, so it is legal in a CHECK.

**Why the message.** Every constraint carries a ``violation_error_message``
(``docs/python.md``), the uniqueness constraint included.

**This validates existing rows when it runs.** On a table with an invalid geometry the migration
fails, which is the intent — the constraint cannot be weaker than the data it guards. The
loaded fixture measured 0 invalid of 431 regions and 0 of 5,685 pieces.
"""

from django.contrib.gis.db.models.functions import IsValid
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0005_region_geom_display_index"),
    ]

    operations = [
        # State-only on the database (`UniqueConstraint` is unchanged); the message is what
        # the ORM raises on a `validate_constraints`/`full_clean` violation.
        migrations.AlterConstraint(
            model_name="region",
            name="regions_region_kind_code_uniq",
            constraint=models.UniqueConstraint(
                fields=("kind", "code"),
                name="regions_region_kind_code_uniq",
                violation_error_message="A region with this kind and code already exists.",
            ),
        ),
        migrations.AddConstraint(
            model_name="region",
            constraint=models.CheckConstraint(
                condition=models.Q(IsValid("geom")),
                name="regions_region_geom_valid",
                violation_error_message="Region geometry must be a valid OGC geometry.",
            ),
        ),
    ]
