"""Add RegionPiece and its GiST index (DEV-2570 / DEV-2604).

``RegionPiece`` holds the subdivided lookup geometry. ``Region.geom`` stays the
authoritative full-resolution boundary; pieces exist only so a point lookup uses
a tight bounding box instead of one enormous one. See the model docstring, and
https://postgis.net/documentation/faq/big-objects-performance/

Existing regions get no pieces here on purpose: the geometry is already loaded,
and subdividing is the importer's job (``import_regions``), which can be re-run
per dimension. A data migration would have to subdivide every row inside the
deploy transaction, which is exactly what the big layers are too slow to do.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("regions", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RegionPiece",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "region",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pieces",
                        to="regions.region",
                    ),
                ),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("zcta", "ZIP Code Tabulation Area"),
                            ("city", "City"),
                            ("council_district", "City Council District"),
                            ("supervisorial_district", "Supervisorial District"),
                            ("spa", "Service Planning Area"),
                            ("coc", "Continuum of Care"),
                        ],
                        db_index=True,
                        max_length=32,
                    ),
                ),
                ("geom", MultiPolygonField(srid=4326)),
            ],
        ),
    ]
