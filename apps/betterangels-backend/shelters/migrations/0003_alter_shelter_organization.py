# Generated by Django 4.2.11 on 2024-04-16 20:11

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        ("shelters", "0002_shelter_organization"),
    ]

    operations = [
        migrations.AlterField(
            model_name="shelter",
            name="organization",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="organizations.organization",
            ),
        ),
    ]
