from django.db import migrations
from django.db import connection
import shelters.enums
import django_choices_field.fields


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0007_update_enum_values"),  # Update with the correct previous migration
    ]

    operations = [
        migrations.AlterField(
            model_name="funder",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("city_of_los_angeles", "City of Los Angeles"),
                    ("dhs", "DHS"),
                    ("dmh", "DMH"),
                    ("federal_funding", "Federal Funding"),
                    ("hopwa", "HOPWA"),
                    ("lahsa", "LAHSA"),
                    ("private", "Private"),
                ],
                choices_enum=shelters.enums.FunderChoices,
                max_length=19,
                null=True,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name="population",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("adults", "Adults"),
                    ("boys", "Boys"),
                    ("children", "Children"),
                    ("domestic_violence", "Domestic Violence (DV/IPV)"),
                    ("enhanced_bridge_housing_older_adults", "Enhanced Bridge Housing for Older Adults"),
                    ("enhanced_bridge_housing_women", "Enhanced Bridge Housing for Women"),
                    ("families", "Families"),
                    ("girls", "Girls"),
                    ("hiv_and_aids", "HIV/AIDS"),
                    ("human_trafficking", "Human Trafficking"),
                    ("justice_system_exiting", "B7 Bridge Housing for Persons Exiting Justice System Institutions"),
                    ("lgbtq", "LGBTQ"),
                    ("men", "Men"),
                    ("seniors", "Seniors (55+)"),
                    ("veterans", "Veterans"),
                    ("women", "Women"),
                    ("youth", "Youth (TAY)"),
                ],
                choices_enum=shelters.enums.PopulationChoices,
                max_length=36,
                null=True,
                unique=True,
            ),
        ),
        migrations.AlterField(
            model_name="sheltertype",
            name="name",
            field=django_choices_field.fields.TextChoicesField(
                blank=True,
                choices=[
                    ("a_bridge_home", "A Bridge Home"),
                    ("crisis_housing", "Crisis Housing"),
                    ("emergency_shelter", "Emergency Shelter"),
                    ("faith_based", "Faith Based"),
                    ("interim_housing", "Interim Housing"),
                    ("permanent_housing", "Permanent Housing"),
                    ("project_homekey", "Project Home Key (PHK)"),
                    ("rapid_rehousing", "Rapid Rehousing"),
                    ("recuperative_care", "Recuperative Care"),
                    ("roadmap_home", "Roadmap Home"),
                    ("safe_park_la", "Safe Park LA"),
                    ("sober_living", "Sober Living"),
                    ("tiny_home_village", "Tiny Home Village"),
                    ("transitional_housing", "Transitional Housing"),
                    ("winter_shelter", "Winter Shelter"),
                ],
                choices_enum=shelters.enums.ShelterChoices,
                max_length=20,
                null=True,
                unique=True,
            ),
        ),
    ]
