# clients/migrations/XXXX_recreate_client_models.py

from django.db import migrations, models
import django.db.models.deletion
import phonenumber_field.modelfields
import clients.enums
import django_choices_field.fields
from django.conf import settings


def reassociate_permissions(apps, schema_editor):
    ContentType = apps.get_model("contenttypes", "ContentType")
    ContentType.objects.filter(app_label="clients", model="clientprofile").delete()
    ContentType.objects.filter(app_label="accounts", model="clientprofile").update(app_label="clients")


class Migration(migrations.Migration):

    initial = True
    dependencies = [
        ("accounts", "0035_remove_client_specific_models"),
    ]

    state_operations = [
        migrations.CreateModel(
            name="ClientProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("address", models.TextField(blank=True, null=True)),
                ("place_of_birth", models.CharField(blank=True, max_length=100, null=True)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                (
                    "eye_color",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("blue", "Blue"),
                            ("brown", "Brown"),
                            ("green", "Green"),
                            ("gray", "Gray"),
                            ("hazel", "Hazel"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.EyeColorEnum,
                        max_length=5,
                        null=True,
                    ),
                ),
                (
                    "gender",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("male", "Male"),
                            ("female", "Female"),
                            ("non_binary", "Non-binary"),
                            ("other", "Other"),
                            ("prefer_not_to_say", "Prefer not to say"),
                        ],
                        choices_enum=clients.enums.GenderEnum,
                        max_length=17,
                        null=True,
                    ),
                ),
                (
                    "hair_color",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("black", "Black"),
                            ("blonde", "Blonde"),
                            ("brown", "Brown"),
                            ("gray", "Gray"),
                            ("red", "Red"),
                            ("white", "White"),
                            ("bald", "Bald"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.HairColorEnum,
                        max_length=6,
                        null=True,
                    ),
                ),
                ("height_in_inches", models.FloatField(blank=True, null=True)),
                ("hmis_id", models.CharField(blank=True, db_index=True, max_length=50, null=True, unique=True)),
                (
                    "marital_status",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("divorced", "Divorced"),
                            ("married", "Married"),
                            ("separated", "Separated"),
                            ("single", "Single"),
                            ("widowed", "Widowed"),
                        ],
                        choices_enum=clients.enums.MaritalStatusEnum,
                        max_length=9,
                        null=True,
                    ),
                ),
                ("nickname", models.CharField(blank=True, max_length=50, null=True)),
                (
                    "phone_number",
                    phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region="US"),
                ),
                ("physical_description", models.TextField(blank=True, null=True)),
                (
                    "preferred_language",
                    django_choices_field.fields.TextChoicesField(
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
                (
                    "pronouns",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("he_him_his", "He/Him/His"),
                            ("she_her_hers", "She/Her/Hers"),
                            ("they_them_theirs", "They/Them/Theirs"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.PronounEnum,
                        max_length=16,
                        null=True,
                    ),
                ),
                ("pronouns_other", models.CharField(blank=True, max_length=100, null=True)),
                (
                    "race",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("american_indian_alaska_native", "American Indian/Alaska Native"),
                            ("asian", "Asian"),
                            ("black_african_american", "Black/African American"),
                            ("hispanic_latino", "Hispanic/Latino"),
                            ("native_hawaiian_pacific_islander", "Native Hawaiian/Pacific Islander"),
                            ("white_caucasian", "White/Caucasian"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.RaceEnum,
                        max_length=32,
                        null=True,
                    ),
                ),
                (
                    "spoken_languages",
                    django.contrib.postgres.fields.ArrayField(
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
                        null=True,
                        size=None,
                    ),
                ),
                (
                    "veteran_status",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[("yes", "Yes"), ("no", "No"), ("prefer_not_to_say", "Prefer not to say")],
                        choices_enum=clients.enums.YesNoPreferNotToSayEnum,
                        max_length=17,
                        null=True,
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="client_profile",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ClientHouseholdMember",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(blank=True, max_length=100, null=True)),
                ("date_of_birth", models.DateField(blank=True, null=True)),
                (
                    "gender",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("male", "Male"),
                            ("female", "Female"),
                            ("non_binary", "Non-binary"),
                            ("other", "Other"),
                            ("prefer_not_to_say", "Prefer not to say"),
                        ],
                        choices_enum=clients.enums.GenderEnum,
                        max_length=17,
                        null=True,
                    ),
                ),
                (
                    "relationship_to_client",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("current_case_manager", "Current Case Manager"),
                            ("past_case_manager", "Past Case Manager"),
                            ("organization", "Organization"),
                            ("aunt", "Aunt"),
                            ("child", "Child"),
                            ("cousin", "Cousin"),
                            ("father", "Father"),
                            ("friend", "Friend"),
                            ("grandparent", "Grandparent"),
                            ("mother", "Mother"),
                            ("pet", "Pet"),
                            ("sibling", "Sibling"),
                            ("uncle", "Uncle"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.RelationshipTypeEnum,
                        max_length=20,
                        null=True,
                    ),
                ),
                ("relationship_to_client_other", models.CharField(blank=True, max_length=100, null=True)),
                (
                    "client_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="household_members",
                        to="clients.clientprofile",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ClientContact",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(blank=True, max_length=100, null=True)),
                ("email", models.EmailField(blank=True, max_length=254, null=True)),
                (
                    "phone_number",
                    phonenumber_field.modelfields.PhoneNumberField(blank=True, max_length=128, null=True, region="US"),
                ),
                ("mailing_address", models.TextField(blank=True, null=True)),
                (
                    "relationship_to_client",
                    django_choices_field.fields.TextChoicesField(
                        blank=True,
                        choices=[
                            ("current_case_manager", "Current Case Manager"),
                            ("past_case_manager", "Past Case Manager"),
                            ("organization", "Organization"),
                            ("aunt", "Aunt"),
                            ("child", "Child"),
                            ("cousin", "Cousin"),
                            ("father", "Father"),
                            ("friend", "Friend"),
                            ("grandparent", "Grandparent"),
                            ("mother", "Mother"),
                            ("pet", "Pet"),
                            ("sibling", "Sibling"),
                            ("uncle", "Uncle"),
                            ("other", "Other"),
                        ],
                        choices_enum=clients.enums.RelationshipTypeEnum,
                        max_length=20,
                        null=True,
                    ),
                ),
                ("relationship_to_client_other", models.CharField(blank=True, max_length=100, null=True)),
                (
                    "client_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="contacts", to="clients.clientprofile"
                    ),
                ),
            ],
            options={
                "abstract": False,
            },
        ),
        migrations.CreateModel(
            name="HmisProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hmis_id", models.CharField(max_length=50)),
                (
                    "agency",
                    django_choices_field.fields.TextChoicesField(
                        choices=[
                            ("lahsa", "LAHSA"),
                            ("santa_monica", "Santa Monica"),
                            ("pasadena", "Pasadena"),
                            ("champ", "CHAMP"),
                            ("vash", "VASH"),
                        ],
                        choices_enum=clients.enums.HmisAgencyEnum,
                        max_length=12,
                    ),
                ),
                (
                    "client_profile",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="hmis_profiles",
                        to="clients.clientprofile",
                    ),
                ),
            ],
            options={
                "constraints": [models.UniqueConstraint(fields=("hmis_id", "agency"), name="unique_hmis_id_agency")],
            },
        ),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(state_operations=state_operations),
        migrations.RunPython(reassociate_permissions),
    ]
