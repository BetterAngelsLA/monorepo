"""Schema migration: disallow NULLs, drop old index, add unique constraint.

Runs after the data migration (0021) that already cleaned up NULLs and duplicates.
"""

from django.db import migrations, models
from django.db.models.functions import Lower


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0021_address_dedup_normalize"),
    ]

    operations = [
        # Alter columns: null=True → default=''.
        migrations.AlterField(
            model_name="address",
            name="street",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AlterField(
            model_name="address",
            name="city",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AlterField(
            model_name="address",
            name="state",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AlterField(
            model_name="address",
            name="zip_code",
            field=models.CharField(blank=True, default="", max_length=10),
        ),
        migrations.AlterField(
            model_name="address",
            name="formatted_address",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        # Drop old index — the unique constraint covers the same columns.
        migrations.RemoveIndex(
            model_name="address",
            name="address_lookup_idx",
        ),
        # Add case-insensitive unique constraint.
        migrations.AddConstraint(
            model_name="address",
            constraint=models.UniqueConstraint(
                Lower("street"),
                Lower("city"),
                Lower("state"),
                Lower("zip_code"),
                name="address_unique_insensitive",
            ),
        ),
        # Adopt the existing unique_location_point DB constraint into Django.
        # Uses SeparateDatabaseAndState because the constraint already exists in PostgreSQL.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddConstraint(
                    model_name="location",
                    constraint=models.UniqueConstraint(
                        fields=["point"],
                        name="unique_location_point",
                    ),
                ),
            ],
            database_operations=[],  # constraint already exists in the DB
        ),
    ]
