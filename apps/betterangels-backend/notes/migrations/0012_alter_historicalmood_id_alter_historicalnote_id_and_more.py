# Generated by Django 4.2.11 on 2024-03-14 18:42

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("notes", "0011_add_casemanager_task_permissions"),
    ]

    operations = [
        migrations.AlterField(
            model_name="historicalmood",
            name="id",
            field=models.BigIntegerField(blank=True, db_index=True, editable=False),
        ),
        migrations.AlterField(
            model_name="historicalnote",
            name="id",
            field=models.BigIntegerField(blank=True, db_index=True, editable=False),
        ),
        migrations.AlterField(
            model_name="mood",
            name="id",
            field=models.BigAutoField(
                editable=False, primary_key=True, serialize=False, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="note",
            name="id",
            field=models.BigAutoField(
                editable=False, primary_key=True, serialize=False, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="service",
            name="id",
            field=models.BigAutoField(
                editable=False, primary_key=True, serialize=False, unique=True
            ),
        ),
        migrations.AlterField(
            model_name="task",
            name="id",
            field=models.BigAutoField(
                editable=False, primary_key=True, serialize=False, unique=True
            ),
        ),
    ]
