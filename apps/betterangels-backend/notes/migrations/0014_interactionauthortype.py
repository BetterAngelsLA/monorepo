# Generated by Django 5.1.4 on 2025-01-29 04:40

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0038_alter_userevent_id"),
        ("notes", "0013_add_note_team"),
    ]

    operations = [
        migrations.CreateModel(
            name="InteractionAuthorType",
            fields=[
                (
                    "user_ptr",
                    models.OneToOneField(
                        auto_created=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        parent_link=True,
                        primary_key=True,
                        serialize=False,
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
            bases=("accounts.user",),
        ),
    ]
