# Generated by Django 5.0.6 on 2024-06-12 15:45

import clients.enums
import django.contrib.postgres.fields
import django_choices_field.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0020_alter_clientprofile_gender_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="clientprofile",
            name="address",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="nickname",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="phone_number",
            field=models.CharField(blank=True, max_length=15, null=True),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="pronouns",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
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
                    choices_enum=clients.enums.LanguageEnum,
                    max_length=19,
                ),
                blank=True,
                default=list,
                size=None,
            ),
        ),
        migrations.AddField(
            model_name="clientprofile",
            name="veteran_status",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[("yes", "Yes"), ("no", "No"), ("prefer_not_to_say", "Prefer not to say")],
                choices_enum=clients.enums.VeteranStatusEnum,
                max_length=17,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="clientprofile",
            name="preferred_language",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
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
                choices_enum=clients.enums.LanguageEnum,
                max_length=19,
                null=True,
            ),
        ),
    ]
