"""Create the Region model (DEV-2570 / DEV-2604).

Deliberately **no** ``CreateExtension("postgis")`` here, despite an earlier
version of this migration having one. The extension is already present in every
environment this code can run in: ``clients``, ``common``, ``hmis`` and
``shelters`` each created geometry columns in their own initial migrations, and
PostGIS cannot create those columns without the extension. Adding
``CreateExtension`` would be a no-op at best.

At worst it is a deploy hazard: PostGIS is **not** a trusted extension in
PostgreSQL, so ``CREATE EXTENSION postgis`` requires superuser or
``rds_superuser``. On RDS the application connects with an IAM-minted token for a
non-superuser role, so that statement can fail and block the whole migration run
— for an extension that is already installed.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies: list = []

    operations = [
        migrations.CreateModel(
            name="Region",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "kind",
                    models.CharField(
                        choices=[
                            ("zip", "ZIP Code"),
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
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("source_url", models.URLField(blank=True, default="", max_length=1024)),
                ("source_vintage", models.CharField(blank=True, default="", max_length=32)),
                ("geom", MultiPolygonField(srid=4326)),
            ],
            options={
                "ordering": ["kind", "code"],
                "constraints": [
                    models.UniqueConstraint(fields=("kind", "code"), name="regions_region_kind_code_uniq")
                ],
            },
        ),
    ]
