# Generated by Django 5.1.3 on 2024-11-25 23:12

import clients.enums
import django_choices_field.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("clients", "0009_clientprofile_caseworker_crud_permissions"),
    ]

    operations = [
        # Update existing rows to map 'santa_monica' to 'lahsa'
        migrations.RunSQL(
            """
            UPDATE clients_hmisprofile
            SET agency = 'lahsa'
            WHERE agency = 'santa_monica';
            """,
            reverse_sql="""
            UPDATE clients_hmisprofile
            SET agency = 'santa_monica'
            WHERE agency = 'lahsa'
              AND hmis_id IN (
                  SELECT hmis_id
                  FROM clients_hmisprofile
                  WHERE agency = 'santa_monica'
              );
            """,
        ),
        # Remove 'santa_monica' from the field choices
        migrations.AlterField(
            model_name="hmisprofile",
            name="agency",
            field=django_choices_field.fields.TextChoicesField(
                choices=[("lahsa", "LAHSA"), ("pasadena", "Pasadena"), ("champ", "CHAMP"), ("vash", "VASH")],
                choices_enum=clients.enums.HmisAgencyEnum,
                max_length=8,
            ),
        ),
    ]
