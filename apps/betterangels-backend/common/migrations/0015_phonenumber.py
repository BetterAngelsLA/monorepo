# Generated by Django 5.1.1 on 2024-09-23 19:57

import django.db.models.deletion
import phonenumber_field.modelfields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("common", "0014_address_confidential_attachment_mime_type_and_more"),
        ("contenttypes", "0002_remove_content_type_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="PhoneNumber",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "number",
                    phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region="US"),
                ),
                ("is_primary", models.BooleanField(default=False)),
                ("object_id", models.PositiveIntegerField()),
                (
                    "content_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype"),
                ),
            ],
            options={
                "indexes": [models.Index(fields=["object_id", "content_type_id"], name="phonenumber_comp_idx")],
            },
        ),
    ]
