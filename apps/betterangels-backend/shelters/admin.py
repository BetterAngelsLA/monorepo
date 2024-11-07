import json
from typing import Any, Optional, Tuple, Type, TypeVar, Union, cast
from urllib.parse import quote

import requests
from betterangels_backend import settings
from common.models import Address, Location
from django import forms
from django.contrib import admin
from django.contrib.admin.models import ADDITION, CHANGE, DELETION  # type: ignore
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Model
from django.forms import CheckboxSelectMultiple, SelectMultiple, TimeInput
from django.http import HttpRequest
from django_choices_field import TextChoicesField
from import_export import resources  # type: ignore
from import_export.admin import ImportExportModelAdmin  # type: ignore
from import_export.fields import Field  # type: ignore
from import_export.results import RowResult  # type: ignore
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget  # type: ignore

# from import_export.widgets import ForeignKeyWidget  # type: ignore
from organizations.models import Organization
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    AccessibilityChoices,
    CareerServiceChoices,
    CityChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    PopulationChoices,
    ShelterChoices,
    SleepingChoices,
    SPAChoices,
    StorageChoices,
)
from .models import (
    SPA,
    Accessibility,
    CareerService,
    City,
    EntryRequirement,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    Parking,
    Pet,
    Population,
    Shelter,
    ShelterType,
    SleepingOption,
    Storage,
)

T = TypeVar("T", bound=models.Model)


class ShelterForm(forms.ModelForm):
    curfew = forms.TimeField(widget=TimeInput(attrs={"type": "time"}), required=False)

    # Advanced Info
    populations = forms.MultipleChoiceField(choices=PopulationChoices, widget=CheckboxSelectMultiple(), required=True)
    shelter_types = forms.MultipleChoiceField(choices=ShelterChoices, widget=CheckboxSelectMultiple(), required=False)
    immediate_needs = forms.MultipleChoiceField(
        choices=ImmediateNeedChoices, widget=CheckboxSelectMultiple(), required=False
    )
    general_services = forms.MultipleChoiceField(
        choices=GeneralServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )
    health_services = forms.MultipleChoiceField(
        choices=HealthServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )
    career_services = forms.MultipleChoiceField(
        choices=CareerServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )
    funders = forms.MultipleChoiceField(choices=FunderChoices, widget=CheckboxSelectMultiple(), required=False)
    accessibility = forms.MultipleChoiceField(
        choices=AccessibilityChoices, widget=CheckboxSelectMultiple(), required=False
    )
    storage = forms.MultipleChoiceField(choices=StorageChoices, widget=CheckboxSelectMultiple(), required=False)
    parking = forms.MultipleChoiceField(choices=ParkingChoices, widget=CheckboxSelectMultiple(), required=False)

    # Restrictions
    entry_requirements = forms.MultipleChoiceField(
        choices=EntryRequirementChoices, widget=CheckboxSelectMultiple(), required=False
    )
    cities = forms.MultipleChoiceField(choices=CityChoices, widget=SelectMultiple(), required=False)
    spa = forms.MultipleChoiceField(choices=SPAChoices, widget=SelectMultiple(), required=False)
    pets = forms.MultipleChoiceField(choices=PetChoices, widget=CheckboxSelectMultiple(), required=False)

    # Sleeping Information
    sleeping_options = forms.MultipleChoiceField(
        choices=SleepingChoices, widget=CheckboxSelectMultiple(), required=False
    )

    class Meta:
        model = Shelter
        fields = "__all__"

    def clean(self) -> dict:
        cleaned_data = super().clean() or {}
        fields_to_clean = {
            "populations": Population,
            "shelter_types": ShelterType,
            "immediate_needs": ImmediateNeed,
            "general_services": GeneralService,
            "health_services": HealthService,
            "career_services": CareerService,
            "funders": Funder,
            "accessibility": Accessibility,
            "storage": Storage,
            "parking": Parking,
            "entry_requirements": EntryRequirement,
            "cities": City,
            "spa": SPA,
            "pets": Pet,
            "sleeping_options": SleepingOption,
        }
        for field_name, model_class in fields_to_clean.items():
            cleaned_data[field_name] = self._clean_choices(field_name, model_class)

        return cleaned_data

    def _clean_choices(self, field_name: str, model_class: Type[T]) -> list[T]:
        choices: list[str] = self.cleaned_data.get(field_name, [])

        if not choices:
            return []

        # Retrieve existing objects and their names
        existing_objects = list(model_class.objects.filter(name__in=choices))  # type: ignore[attr-defined]
        existing_entries = {str(obj) for obj in existing_objects}

        # Create missing objects
        missing_choices = [model_class(name=choice) for choice in choices if choice not in existing_entries]
        if missing_choices:
            new_objects = model_class.objects.bulk_create(missing_choices)  # type: ignore[attr-defined]
            existing_objects.extend(new_objects)

        return existing_objects


class ShelterResource(resources.ModelResource):

    organization = Field(
        column_name="organization", attribute="organization", widget=ForeignKeyWidget(Organization, "name")
    )
    spa = Field(column_name="spa", attribute="spa", widget=ManyToManyWidget(SPA, separator=",", field="name"))
    address = Field(column_name="address", attribute="address", widget=ForeignKeyWidget(Address, "formatted_address"))
    populations = Field(
        column_name="populations",
        attribute="populations",
        widget=ManyToManyWidget(Population, separator=",", field="name"),
    )
    general_services = Field(
        column_name="general_services",
        attribute="general_services",
        widget=ManyToManyWidget(GeneralService, separator=",", field="name"),
    )
    immediate_needs = Field(
        column_name="immediate_needs",
        attribute="immediate_needs",
        widget=ManyToManyWidget(ImmediateNeed, separator=",", field="name"),
    )
    shelter_types = Field(
        column_name="shelter_types",
        attribute="shelter_types",
        widget=ManyToManyWidget(ShelterType, separator=",", field="name"),
    )
    career_services = Field(
        column_name="career_services",
        attribute="career_services",
        widget=ManyToManyWidget(CareerService, separator=",", field="name"),
    )
    sleeping_options = Field(
        column_name="sleeping_options",
        attribute="sleeping_options",
        widget=ManyToManyWidget(SleepingOption, separator=",", field="name"),
    )
    funders = Field(
        column_name="funders",
        attribute="funders",
        widget=ManyToManyWidget(Funder, separator=",", field="name"),
    )
    health_services = Field(
        column_name="health_services",
        attribute="health_services",
        widget=ManyToManyWidget(HealthService, separator=",", field="name"),
    )
    entry_requirements = Field(
        column_name="entry_requirements",
        attribute="entry_requirements",
        widget=ManyToManyWidget(EntryRequirement, separator=",", field="name"),
    )
    storage = Field(
        column_name="storage",
        attribute="storage",
        widget=ManyToManyWidget(Storage, separator=",", field="name"),
    )
    count = 0

    class Meta:
        model = Shelter
        import_id_fields = (
            "name",
            "organization",
        )
        exclude = ("id", "created_at", "updated_at")

    def before_import_row(self, row: Any, **kwargs: Any) -> None:
        self.count += 1
        skip_row_not_val_error = True
        if skip_row_not_val_error:
            row["jumpthis"] = False
        for field in Shelter._meta.get_fields():
            if hasattr(field, "max_length") and field.max_length:
                fieldname = field.name
                value = row.get(fieldname)
                if value and (len(value) > field.max_length):
                    print(f"Change {value} in row {self.count} col {fieldname}")
                    if skip_row_not_val_error:
                        row[fieldname] = ""
                        row["jumpthis"] = True
                    else:
                        raise ValidationError(f"Change {value} in row {self.count} col {fieldname}")
        org_name = row.get("organization")
        spa_name = row.get("spa")
        addy_name = row.get("address")
        customFields = [
            "populations",
            "general_services",
            "immediate_needs",
            "shelter_types",
            "career_services",
            "sleeping_options",
            "funders",
            "health_services",
            "entry_requirements",
            "storage",
        ]  # in this case, the many to many fields
        rowInDict = {}
        for column in row.keys():
            rowInDict[column] = row.get(column)
        if org_name:
            org, created = Organization.objects.get_or_create(name=org_name)
            # This process SPA name considering the ManyToMany nature of the field
            # Gets existing object or makes it if one doesn't exist
            if spa_name:
                spa_names = [v.strip() for v in spa_name.split(",")]
                spa_choices = {i for i in range(1, len(SPAChoices.choices) + 1)}
                for spa_name in spa_names:
                    try:
                        if int(spa_name) in spa_choices:
                            sp, createdSpa = SPA.objects.get_or_create(name=spa_name)
                        else:
                            raise ValueError
                    except ValueError:
                        print(f"Row {self.count}: Bad SPA value")
                        if skip_row_not_val_error:
                            row["spa"] = None
                            row["jumpthis"] = True
                        else:
                            raise ValidationError(
                                f"Value in row {self.count} column spa must have a value between 1 and 8"
                            )
            # Same idea as the handling for SPA, but uses existing get_or_create_address method in Location class to handle Address creation
            if addy_name:
                addy_data = requests.get(
                    f"https://maps.googleapis.com/maps/api/geocode/json?address={quote(addy_name)}&key={quote(settings.GOOGLE_MAPS_API_KEY)}"
                )
                try:
                    addy_formatted_data = addy_data.json()["results"][0]["formatted_address"]
                    addy_for_location_method = addy_data.json()["results"][0]
                    addy_for_location_method["address_components"] = json.dumps(
                        addy_for_location_method["address_components"]
                    )
                    addy_address = Location.get_or_create_address(addy_for_location_method)
                    if None in [addy_address.street, addy_address.city, addy_address.state, addy_address.zip_code]:
                        raise IndexError
                    row["address"] = addy_formatted_data
                except IndexError:
                    print(f"Address at {self.count} bad")
                    if skip_row_not_val_error:
                        row["address"] = None
                        row["jumpthis"] = True
                    else:
                        raise ValidationError(f"Invalid Address at {self.count}")
            # This is to process the ManyToMany fields, grabs the data within the CSV and matches it to the proper choice for that column
            for column in customFields:
                if rowInDict[column]:
                    fieldModel = cast(Type[Model], Shelter._meta.get_field(column).related_model)
                    fieldModelChoices = cast(TextChoicesField, fieldModel._meta.get_field("name")).choices
                    columnSeparateVals = [v.strip() for v in rowInDict[column].split(",")]
                    row_vals_choices = {j: i for i, j in fieldModelChoices}  # type: ignore
                    for i, indVal in enumerate(columnSeparateVals):
                        try:
                            if indVal in row_vals_choices:
                                brand_new_obj, createdNewObjectInModel = fieldModel.objects.get_or_create(  # type: ignore
                                    name=row_vals_choices[indVal]
                                )
                                columnSeparateVals[i] = row_vals_choices[indVal]
                            else:
                                print(i, indVal, columnSeparateVals)
                                raise ValueError
                        except ValueError:
                            print(f"Row {self.count}: Bad {column} value, {indVal} is not in {row_vals_choices}")
                            if skip_row_not_val_error:
                                row[column] = None
                                row["jumpthis"] = True
                            else:
                                raise ValidationError(
                                    f"Row {self.count}: Bad {column} value, {indVal} is not in {row_vals_choices}"
                                )
                    row[column] = ",".join(columnSeparateVals)
        else:
            print(f"No org name: {self.count} {row}")
            if skip_row_not_val_error:
                row["jumpthis"] = True
            else:
                raise ValidationError(f"Row {self.count} is missing an Organization")

    def skip_row(self, instance: Any, original: Any, row: Any, import_validation_errors: Any | None = None) -> bool:
        if row.get("jumpthis"):
            return True
        return bool(super().skip_row(instance, original, row, import_validation_errors))


class ShelterAdmin(ImportExportModelAdmin):
    form = ShelterForm

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("name", "organization", "email", "phone", "website"),
            },
        ),
        (
            "Other Details",
            {"fields": ("description", "how_to_enter", "mandatory_worship_attendance")},
        ),
        (
            "Location",
            {"fields": ("address",)},
        ),
        (
            "Advanced Info",
            {
                "fields": (
                    "shelter_types",
                    "populations",
                    "immediate_needs",
                    "general_services",
                    "health_services",
                    "career_services",
                    "funders",
                    "accessibility",
                    "storage",
                    "parking",
                )
            },
        ),
        (
            "Restrictions",
            {
                "fields": (
                    "entry_requirements",
                    "cities",
                    "city_district",
                    "supervisorial_district",
                    "spa",
                    "pets",
                    "curfew",
                    "max_stay",
                    "security",
                    "drugs",
                    "program_fees",
                )
            },
        ),
        (
            "Beds",
            {
                "fields": (
                    "fees",
                    "total_beds",
                    "sleeping_options",
                )
            },
        ),
        ("BA Administration", {"fields": ("is_reviewed",)}),
    )

    list_display = ("name", "organization", "address", "phone", "email", "website", "is_reviewed")
    list_filter = ("is_reviewed",)
    search_fields = ("name", "organization__name")
    resource_class = ShelterResource

    def get_readonly_fields(
        self, request: HttpRequest, obj: Optional[Shelter] = None
    ) -> Union[list[str], Tuple[str, ...]]:
        readonly_fields = tuple(super().get_readonly_fields(request, obj))
        if not request.user.has_perm(ShelterFieldPermissions.CHANGE_IS_REVIEWED):
            readonly_fields = (*readonly_fields, "is_reviewed")
        return readonly_fields

    def _create_log_entries(self, user_pk, rows):  # type: ignore
        logentry_map = {
            RowResult.IMPORT_TYPE_NEW: ADDITION,
            RowResult.IMPORT_TYPE_UPDATE: CHANGE,
            RowResult.IMPORT_TYPE_DELETE: DELETION,
        }
        for import_type, _instances in rows.items():
            print(f"Hello import_type is here {import_type}")
            if import_type not in logentry_map:
                continue
            action_flag = logentry_map[import_type]
            print(f"{action_flag} and {logentry_map}")
            self._create_log_entry(user_pk, rows[import_type], import_type, action_flag)


admin.site.register(Shelter, ShelterAdmin)
