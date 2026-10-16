"""The Region schema: boundaries, the subdivided point-lookup geometry, and a crosswalk.

``LocationRegion``, the third table here, is dropped by ``0004_region_lookup_view``; see
``regions/models.py`` for what the surviving two are for.

**No ``CreateExtension("postgis")``.** The extension is already present: ``clients``,
``common``, ``hmis`` and ``shelters`` each created geometry columns in their own
initial migrations, and PostGIS cannot create those columns without it. Worse, it
would be a deploy hazard — PostGIS is not a trusted extension, so
``CREATE EXTENSION postgis`` needs superuser or ``rds_superuser``, and on RDS the
application connects with an IAM-minted token for a non-superuser role. Its reverse
migration would also ``DROP EXTENSION`` out from under those four apps.

The empty tables are the whole of what this migration leaves behind: there is nothing to
backfill, because the boundaries arrive later through ``import_regions``.
"""

from django.contrib.gis.db.models import MultiPolygonField
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("common", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Region",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
                ("source_attribution", models.TextField(blank=True, default="")),
                ("source_item_id", models.CharField(blank=True, default="", max_length=64)),
                ("geom", MultiPolygonField(srid=4326)),
                ("geom_display", MultiPolygonField(blank=True, null=True, srid=4326)),
            ],
            options={
                "ordering": ["kind", "code"],
                "constraints": [
                    models.UniqueConstraint(fields=("kind", "code"), name="regions_region_kind_code_uniq")
                ],
            },
        ),
        migrations.CreateModel(
            name="RegionPiece",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
                ("geom", MultiPolygonField(srid=4326)),
            ],
        ),
        migrations.CreateModel(
            name="LocationRegion",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
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
                (
                    "location",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="region_assignments",
                        to="common.location",
                    ),
                ),
                (
                    "region",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assignments",
                        to="regions.region",
                    ),
                ),
            ],
            options={
                "constraints": [
                    models.UniqueConstraint(fields=("location", "kind"), name="unique_location_kind_assignment")
                ],
            },
        ),
    ]
