import django.db.models.deletion
import django.db.models.functions.text
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0036_update_pet_and_bed_status_choices"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255, unique=True)),
                ("display_name", models.CharField(max_length=255)),
                ("priority", models.PositiveIntegerField(db_index=True, default=0)),
            ],
            options={
                "verbose_name_plural": "Service categories",
                "ordering": ["priority", "display_name"],
            },
        ),
        migrations.CreateModel(
            name="Service",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=255)),
                ("display_name", models.CharField(max_length=255)),
                ("priority", models.PositiveIntegerField(db_index=True, default=0)),
                ("is_other", models.BooleanField(db_index=True, default=False)),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="services",
                        to="shelters.servicecategory",
                    ),
                ),
            ],
            options={
                "ordering": ["category__priority", "is_other", "priority", "display_name"],
            },
        ),
        migrations.AddConstraint(
            model_name="service",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("name"),
                models.F("category"),
                name="service_name_category_ci_unique",
            ),
        ),
        migrations.AddField(
            model_name="shelter",
            name="services",
            field=models.ManyToManyField(blank=True, to="shelters.service"),
        ),
    ]
