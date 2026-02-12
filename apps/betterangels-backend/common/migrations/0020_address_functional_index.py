# Generated migration for functional index

from django.db import migrations, models
from django.db.models.functions import Lower


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0019_remove_address_components_improve_dedup"),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name="address",
            name="address_index",
        ),
        migrations.AddIndex(
            model_name="address",
            index=models.Index(
                Lower("street"),
                Lower("city"),
                Lower("state"),
                Lower("zip_code"),
                name="address_lookup_idx",
            ),
        ),
    ]
