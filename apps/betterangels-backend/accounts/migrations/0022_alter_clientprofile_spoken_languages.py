# Generated by Django 5.0.6 on 2024-06-12 23:14

import accounts.enums
import django.contrib.postgres.fields
import django_choices_field.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0021_clientprofile_address_clientprofile_nickname_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="clientprofile",
            name="spoken_languages",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=django_choices_field.fields.TextChoicesField(
                    choices=[
                        ("arabic", "Arabic"),
                        ("armenian", "Armenian"),
                        ("english", "English"),
                        ("farsi", "Farsi"),
                        ("indonesian", "Indonesian"),
                        ("japanese", "Japanese"),
                        ("khmer", "Khmer"),
                        ("korean", "Korean"),
                        ("russian", "Russian"),
                        ("simplified_chinese", "Simplified Chinese"),
                        ("spanish", "Spanish"),
                        ("tagalog", "Tagalog"),
                        ("traditional_chinese", "Traditional Chinese"),
                        ("vietnamese", "Vietnamese"),
                    ],
                    choices_enum=accounts.enums.LanguageEnum,
                    max_length=19,
                ),
                blank=True,
                null=True,
                size=None,
            ),
        ),
    ]
