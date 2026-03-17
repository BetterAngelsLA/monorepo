from django.db import migrations, models
import django.db.models.deletion
import django_choices_field.fields
import shelters.enums


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0031_remove_clientprofile_client_profile_add_insert_and_more"),
        ("shelters", "0034_modify_shelter_group_permissions_add_schedule"),
    ]

    operations = [
        migrations.AddField(
            model_name="bed",
            name="bed_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="bed",
            name="status_notes",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bed",
            name="occupant",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="occupied_beds",
                to="clients.clientprofile",
            ),
        ),
        migrations.AddField(
            model_name="bed",
            name="bed_type",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("twin", "Twin"),
                    ("bunk", "Bunk"),
                    ("rollaway", "Rollaway"),
                    ("other", "Other"),
                ],
                choices_enum=shelters.enums.BedTypeChoices,
                max_length=8,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="bed",
            name="demographics",
            field=models.ManyToManyField(blank=True, to="shelters.demographic"),
        ),
        migrations.AddField(
            model_name="bed",
            name="accessibility",
            field=models.ManyToManyField(blank=True, to="shelters.accessibility"),
        ),
        migrations.AddField(
            model_name="bed",
            name="funders",
            field=models.ManyToManyField(blank=True, to="shelters.funder"),
        ),
        migrations.AddField(
            model_name="bed",
            name="pets",
            field=models.ManyToManyField(blank=True, to="shelters.pet"),
        ),
        migrations.AddField(
            model_name="bed",
            name="storage",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name="bed",
            name="maintenance_flag",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name="bed",
            name="last_cleaned_inspected",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bed",
            name="medical_needs",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("erc", "ERC (Enrich Residential Care)"),
                    ("dmh", "DMH Beds (Dept of Mental Health)"),
                    ("oxygen", "Oxygen"),
                    ("dialysis", "Dialysis"),
                ],
                choices_enum=shelters.enums.MedicalNeedChoices,
                max_length=8,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="bed",
            name="b7",
            field=models.BooleanField(blank=True, default=False),
        ),
        migrations.AddField(
            model_name="bed",
            name="fees",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
