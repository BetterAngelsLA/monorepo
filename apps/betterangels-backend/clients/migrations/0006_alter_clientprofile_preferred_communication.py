# Generated by Django 5.1.1 on 2024-10-02 17:28

import clients.enums
import django.contrib.postgres.fields
import django_choices_field.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0005_clientprofile_ada_accommodation"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientprofile",
            name="preferred_communication",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=django_choices_field.fields.TextChoicesField(
                    choices=[
                        ("call", "Call"),
                        ("email", "Email"),
                        ("facebook", "Facebook"),
                        ("instagram", "Instagram"),
                        ("linkedin", "LinkedIn"),
                        ("text", "Text"),
                        ("whatsapp", "WhatsApp"),
                    ],
                    choices_enum=clients.enums.PreferredCommunicationEnum,
                    max_length=9,
                ),
                blank=True,
                null=True,
                size=None,
            ),
        ),
    ]
