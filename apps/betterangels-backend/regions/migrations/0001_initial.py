"""Create the Region model and the PostGIS extension (DEV-2570 / DEV-2604).

``CreateExtension("postgis")`` is added here explicitly. Nothing in the project
created it before: local PostGIS came from the DB image and RDS was assumed to
have it. Making it a migration means every environment either has the extension
or fails loudly at migrate time rather than at the first geometry INSERT.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.contrib.postgres.operations import CreateExtension
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies: list = []

    operations = [
        CreateExtension("postgis"),
        migrations.CreateModel(
            name="Region",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
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
                ("code", models.CharField(max_length=32)),
                ("name", models.CharField(blank=True, default="", max_length=255)),
                ("source_url", models.URLField(blank=True, default="", max_length=1024)),
                ("source_vintage", models.CharField(blank=True, default="", max_length=32)),
                ("geom", MultiPolygonField(srid=4326)),
            ],
            options={
                "ordering": ["kind", "code"],
                "indexes": [models.Index(fields=["kind"], name="regions_region_kind_idx")],
                "constraints": [
                    models.UniqueConstraint(fields=("kind", "code"), name="regions_region_kind_code_uniq")
                ],
            },
        ),
    ]
