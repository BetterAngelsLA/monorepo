# Generated by Django 5.1.1 on 2024-10-04 17:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notes", "0009_remove_note_note_add_insert_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="note",
            name="title",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AlterField(
            model_name="noteevent",
            name="title",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
