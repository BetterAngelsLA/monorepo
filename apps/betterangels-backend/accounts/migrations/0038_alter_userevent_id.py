# Generated by Django 5.1.1 on 2024-09-12 22:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0037_remove_client_specific_models"),
    ]

    operations = [
        migrations.AlterField(
            model_name="userevent",
            name="id",
            field=models.BigIntegerField(),
        ),
    ]
