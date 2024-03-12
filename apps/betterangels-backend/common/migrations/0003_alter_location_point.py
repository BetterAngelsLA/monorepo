# Generated by Django 4.2.11 on 2024-03-06 01:30

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("common", "0002_add_location"),
    ]

    operations = [
        migrations.AlterField(
            model_name="location",
            name="point",
            field=django.contrib.gis.db.models.fields.PointField(
                geography=True, srid=4326
            ),
        ),
    ]
