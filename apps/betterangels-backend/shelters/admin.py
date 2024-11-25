import json
import logging
from typing import Any, Optional, Tuple, Type, TypeVar, Union, cast
from urllib.parse import quote

import places
import requests
from betterangels_backend import settings
from common.models import Location

# from betterangels_backend import settings
from django import forms
from django.contrib import admin
from django.contrib.admin.models import ADDITION, CHANGE, DELETION
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.forms import TimeInput
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
from django_choices_field import TextChoicesField
from django_select2.forms import Select2MultipleWidget
from import_export import resources  # type: ignore
from import_export.admin import ImportExportModelAdmin  # type: ignore
from import_export.fields import Field  # type: ignore
from import_export.results import RowResult  # type: ignore
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget  # type: ignore
from organizations.models import Organization
from pghistory.models import MiddlewareEvents
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from .models import (  # RoomStyle,; ShelterProgram,
    SPA,
    Accessibility,
    City,
    ContactInfo,
    Demographic,
    EntryRequirement,
    ExteriorPhoto,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    InteriorPhoto,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
    Video,
)

# RoomStyle,
# ShelterProgram,

T = TypeVar("T", bound=models.Model)
logger = logging.getLogger(__name__)
User = get_user_model()


class ShelterForm(forms.ModelForm):
    template_name = "admin/shelters/change_form.html"  # Specify your custom template path

    # Summary Info
    demographics = forms.MultipleChoiceField(
        choices=DemographicChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select demographics...",
                "data-allow-clear": "true",
            }
        ),
        required=True,
    )
    demographics_other = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "Please specify..."}),
    )
    special_situation_restrictions = forms.MultipleChoiceField(
        choices=SpecialSituationRestrictionChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select special situation restrictions...",
                "data-allow-clear": "true",
            }
        ),
        required=True,
    )
    shelter_types = forms.MultipleChoiceField(
        choices=ShelterChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select shelter types...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    shelter_types_other = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "Please specify..."}),
    )

    # Sleeping Details
    room_styles = forms.MultipleChoiceField(
        choices=RoomStyleChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select room style...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    room_styles_other = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "Please specify..."}),
    )

    # Shelter Details
    accessibility = forms.MultipleChoiceField(
        choices=AccessibilityChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select accessibility...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    storage = forms.MultipleChoiceField(
        choices=StorageChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select storage...",
                "data-allow-clear": "true",
            }
        ),
        required=True,
    )
    pets = forms.MultipleChoiceField(
        choices=PetChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select pets...",
                "data-allow-clear": "true",
            }
        ),
        required=True,
    )
    parking = forms.MultipleChoiceField(
        choices=ParkingChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select parking...",
                "data-allow-clear": "true",
            }
        ),
        required=True,
    )

    # Restrictions
    curfew = forms.TimeField(widget=TimeInput(attrs={"type": "time"}), required=False)

    # Services Offered
    immediate_needs = forms.MultipleChoiceField(
        choices=ImmediateNeedChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select immediate needs...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    general_services = forms.MultipleChoiceField(
        choices=GeneralServiceChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select general services...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    health_services = forms.MultipleChoiceField(
        choices=HealthServiceChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select health services...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    training_services = forms.MultipleChoiceField(
        choices=TrainingServiceChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select training services...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )

    # Entry Requirements
    entry_requirements = forms.MultipleChoiceField(
        choices=EntryRequirementChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select entry requirements...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )

    # Ecosystem Information
    cities = forms.MultipleChoiceField(
        choices=CityChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select cities...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    spa = forms.MultipleChoiceField(
        choices=SPAChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select SPA...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    shelter_programs = forms.MultipleChoiceField(
        choices=ShelterProgramChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select shelter programs...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    shelter_programs_other = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Please specify...",
            }
        ),
    )
    funders = forms.MultipleChoiceField(
        choices=FunderChoices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select funders...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )
    funders_other = forms.CharField(
        required=False,
        widget=forms.TextInput(
            attrs={
                "placeholder": "Please specify...",
            }
        ),
    )

    class Meta:
        model = Shelter
        fields = "__all__"

    class Media:
        js = (
            "admin/js/jquery.init.js",
            "admin/js/dynamic_fields.js",
        )

    def clean(self) -> dict:
        cleaned_data = super().clean() or {}

        # Dynamically detect all ManyToManyField attributes in the model
        many_to_many_fields = [
            field.name for field in self._meta.model._meta.get_fields() if isinstance(field, models.ManyToManyField)
        ]

        for field_name in many_to_many_fields:
            model_class = self._meta.model._meta.get_field(field_name).related_model
            cleaned_data[field_name] = self._clean_choices(field_name, model_class)

        # Detect fields with "_other" dynamically
        other_fields = [
            field_name.removesuffix("_other") for field_name in self.fields.keys() if field_name.endswith("_other")
        ]

        # Validate each dynamically detected pair
        for multi_field in other_fields:
            text_field = f"{multi_field}_other"
            multi_values = cleaned_data.get(multi_field, [])
            multi_values = [str(m.name) for m in multi_values] if multi_values else []
            text_value = cleaned_data.get(text_field)

            if "other" in multi_values and not text_value:
                self.add_error(
                    text_field,
                    f"This field is required when 'Other' is selected in {multi_field}.",
                )

        return cleaned_data

    def _clean_choices(self, field_name: str, model_class: Type[T]) -> list[T]:
        """
        Handles the cleaning of ManyToMany fields by ensuring all selected choices
        exist in the related model.
        """
        choices = self.cleaned_data.get(field_name, [])

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


class ContactInfoInline(admin.TabularInline):
    model = ContactInfo
    extra = 1
    fields = ["contact_name", "contact_number"]
    verbose_name = "Additional Contact"
    verbose_name_plural = "Additional Contacts"


class ExteriorPhotoInline(admin.TabularInline):
    model = ExteriorPhoto
    extra = 1


class InterPhotoInline(admin.TabularInline):
    model = InteriorPhoto
    extra = 1


class VideoInline(admin.TabularInline):
    model = Video
    extra = 1


class ShelterResource(resources.ModelResource):

    organization = Field(
        column_name="organization", attribute="organization", widget=ForeignKeyWidget(Organization, "name")
    )
    spa = Field(column_name="spa", attribute="spa", widget=ManyToManyWidget(SPA, separator=",", field="name"))
    # address = Field(column_name="address", attribute="address", widget=ForeignKeyWidget(Address, "formatted_address"))
    demographics = Field(
        column_name="demographics",
        attribute="demographics",
        widget=ManyToManyWidget(Demographic, separator=",", field="name"),
    )
    special_situation_restrictions = Field(
        column_name="special_situation_restrictions",
        attribute="special_situation_restrictions",
        widget=ManyToManyWidget(SpecialSituationRestriction, separator=",", field="name"),
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
    shelter_programs = Field(
        column_name="shelter_programs",
        attribute="shelter_programs",
        widget=ManyToManyWidget(ShelterProgram, separator=",", field="name"),
    )
    room_styles = Field(
        column_name="room_styles",
        attribute="room_styles",
        widget=ManyToManyWidget(RoomStyle, separator=",", field="name"),
    )
    accessibility = Field(
        column_name="accessibility",
        attribute="accessibility",
        widget=ManyToManyWidget(Accessibility, separator=",", field="name"),
    )
    pets = Field(
        column_name="pets",
        attribute="pets",
        widget=ManyToManyWidget(Pet, separator=",", field="name"),
    )
    parking = Field(
        column_name="parking",
        attribute="parking",
        widget=ManyToManyWidget(Parking, separator=",", field="name"),
    )
    training_services = Field(
        column_name="training_services",
        attribute="training_services",
        widget=ManyToManyWidget(TrainingService, separator=",", field="name"),
    )
    cities = Field(
        column_name="cities",
        attribute="cities",
        widget=ManyToManyWidget(City, separator=",", field="name"),
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

    def process_spa_import(self, row: Any, skip_row_not_val_error: bool, spa_row: str) -> None:
        spa_names = [v.strip() for v in spa_row.split(",")]
        spa_choices = {i for i in range(1, len(SPAChoices.choices) + 1)}
        for spa_name in spa_names:
            try:
                if int(spa_name) in spa_choices:
                    sp, createdSpa = SPA.objects.get_or_create(name=spa_name)
                else:
                    raise ValueError
            except ValueError:
                logger.warning(f"Row {self.count}: Bad SPA value")
                if skip_row_not_val_error:
                    row["spa"] = None
                    row["jumpthis"] = True
                else:
                    raise ValidationError(f"Value in row {self.count} column spa must have a value between 1 and 8")

    def process_address_import(self, row: Any, skip_row_not_val_error: bool, address_row: str) -> None:
        addy_data = requests.get(
            f"https://maps.googleapis.com/maps/api/geocode/json?address={quote(address_row)}&key={quote(settings.GOOGLE_MAPS_API_KEY)}"
        )
        try:
            addy_formatted_data = addy_data.json()["results"][0]["formatted_address"]
            addy_formatted_coords = addy_data.json()["results"][0]["geometry"]["location"]
            addy_to_places_object = places.Places(
                addy_formatted_data, addy_formatted_coords["lat"], addy_formatted_coords["lng"]
            )
            addy_for_location_method = addy_data.json()["results"][0]
            addy_for_location_method["address_components"] = json.dumps(addy_for_location_method["address_components"])
            addy_address = Location.get_or_create_address(addy_for_location_method)
            if None in [addy_address.street, addy_address.city, addy_address.state, addy_address.zip_code]:
                raise IndexError
            row["location"] = addy_to_places_object
        except IndexError:
            logger.warning(f"Address at {self.count} bad")
            if skip_row_not_val_error:
                row["location"] = None
                row["jumpthis"] = True
            else:
                raise ValidationError(f"Invalid Location at {self.count}")

    def process_many_to_many_import(self, row: Any, skip_row_not_val_error: bool, rowInDict: dict, column: str) -> None:
        fieldModel = cast(Type[models.Model], Shelter._meta.get_field(column).related_model)
        fieldModelChoices = cast(TextChoicesField, fieldModel._meta.get_field("name")).choices
        columnSeparateVals = [v.strip() for v in rowInDict[column].split(",")]
        row_vals_choices = {j: i for i, j in fieldModelChoices}  # type: ignore
        for i, indVal in enumerate(columnSeparateVals):
            try:
                if indVal in row_vals_choices:
                    if row_vals_choices[indVal] == "other":
                        if not rowInDict[f"{column}_other"]:
                            raise ValueError
                    brand_new_obj, createdNewObjectInModel = fieldModel.objects.get_or_create(  # type: ignore
                        name=row_vals_choices[indVal]
                    )
                    columnSeparateVals[i] = row_vals_choices[indVal]
                else:
                    raise ValueError
            except ValueError:
                logger.warning(f"Row {self.count}: Bad {column} value, {indVal} is not in {row_vals_choices}")
                if skip_row_not_val_error:
                    row[column] = None
                    row["jumpthis"] = True
                else:
                    raise ValidationError(
                        f"Row {self.count}: Bad {column} value, {indVal} is not in {row_vals_choices}"
                    )
        row[column] = ",".join(columnSeparateVals)

    def before_import_row(self, row: Any, **kwargs: Any) -> None:
        self.count += 1
        skip_row_not_val_error = True
        if skip_row_not_val_error:
            row["jumpthis"] = False

        # This for loop checks for fields that have exceeded their max length
        for field in Shelter._meta.get_fields():
            if hasattr(field, "max_length") and field.max_length:
                fieldname = field.name
                value = row.get(fieldname)
                if value and (len(value) > field.max_length):
                    logger.warning(f"Change {value} in row {self.count} col {fieldname}")
                    if skip_row_not_val_error:
                        row[fieldname] = ""
                        row["jumpthis"] = True
                    else:
                        raise ValidationError(f"Change {value} in row {self.count} col {fieldname}")
        customFields = [
            "demographics",
            "special_situation_restrictions",
            "general_services",
            "immediate_needs",
            "shelter_types",
            "shelter_programs",
            "training_services",
            "room_styles",
            "funders",
            "health_services",
            "entry_requirements",
            "storage",
            "pets",
            "cities",
            "accessibility",
            "parking",
        ]  # in this case, the many to many fields
        rowInDict = {}
        for column in row.keys():
            rowInDict[column] = row.get(column)
        if rowInDict["organization"]:
            org, created = Organization.objects.get_or_create(name=rowInDict["organization"])
            # This process SPA name considering the ManyToMany nature of the field
            # Gets existing object or makes it if one doesn't exist
            if rowInDict["status"]:
                if rowInDict["status"] not in [j for _, j in StatusChoices.choices]:
                    if skip_row_not_val_error:
                        row[fieldname] = ""
                        row["jumpthis"] = True
                    else:
                        raise ValidationError(f"Change {value} in row {self.count} col {fieldname}")
            if rowInDict["spa"]:
                self.process_spa_import(row, skip_row_not_val_error, rowInDict["spa"])
            # Same idea as the handling for SPA, but uses existing get_or_create_address method in Location class to handle Address creation
            if rowInDict["location"]:
                self.process_address_import(row, skip_row_not_val_error, rowInDict["location"])
            # This is to process the ManyToMany fields, grabs the data within the CSV and matches it to the proper choice for that column
            for column in customFields:
                if rowInDict[column]:
                    self.process_many_to_many_import(row, skip_row_not_val_error, rowInDict, column)
        else:
            logger.warning(f"No org name: {self.count} {row}")
            if skip_row_not_val_error:
                row["jumpthis"] = True
            else:
                raise ValidationError(f"Row {self.count} is missing an Organization")

    # Skips any row that has an error, based on whether or not "jumpthis" columns was set to True during
    # import, and also whether or not skip_row_not_val_error boolean is True or False
    def skip_row(self, instance: Any, original: Any, row: Any, import_validation_errors: Any | None = None) -> bool:
        if row.get("jumpthis"):
            return True
        return bool(super().skip_row(instance, original, row, import_validation_errors))


class ShelterAdmin(ImportExportModelAdmin):
    form = ShelterForm

    inlines = [ContactInfoInline, ExteriorPhotoInline, InterPhotoInline, VideoInline]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "organization",
                    "location",
                    "email",
                    "phone",
                    "website",
                ),
            },
        ),
        (
            "Summary Info",
            {
                "fields": (
                    "description",
                    "demographics",
                    "demographics_other",
                    "special_situation_restrictions",
                    "shelter_types",
                    "shelter_types_other",
                )
            },
        ),
        (
            "Sleeping Details",
            {
                "fields": (
                    "total_beds",
                    "room_styles",
                    "room_styles_other",
                )
            },
        ),
        (
            "Shelter Details",
            {
                "fields": (
                    "accessibility",
                    "storage",
                    "pets",
                    "parking",
                )
            },
        ),
        (
            "Restrictions",
            {
                "fields": (
                    "max_stay",
                    "curfew",
                    "on_site_security",
                    "other_rules",
                )
            },
        ),
        (
            "Services Offered",
            {
                "fields": (
                    "immediate_needs",
                    "general_services",
                    "health_services",
                    "training_services",
                    "other_services",
                )
            },
        ),
        (
            "Entry Requirements",
            {
                "fields": (
                    "entry_info",
                    "entry_requirements",
                    "bed_fees",
                    "program_fees",
                )
            },
        ),
        (
            "Ecosystem Information",
            {
                "fields": (
                    "cities",
                    "spa",
                    "city_council_district",
                    "supervisorial_district",
                    "shelter_programs",
                    "shelter_programs_other",
                    "funders",
                    "funders_other",
                )
            },
        ),
        (
            "Better Angels Review",
            {
                "fields": (
                    "overall_rating",
                    "subjective_review",
                )
            },
        ),
        (
            "Better Angels Administration",
            {
                "fields": (
                    "status",
                    # "contact_info",
                    "updated_at",
                    "updated_by",
                )
            },
        ),
    )

    list_display = (
        "name",
        "organization",
        "location",
        "phone",
        "email",
        "website",
        "total_beds",
        "max_stay",
        "status",
        "updated_at",
        "updated_by",
    )
    list_filter = (
        # Basic Information
        "organization",
        # Summary Info
        "demographics",
        "special_situation_restrictions",
        "shelter_types",
        # Sleeping Details
        "room_styles",
        # Shelter Details
        "accessibility",
        "storage",
        "pets",
        "parking",
        # Restrictions
        "max_stay",
        "on_site_security",
        # Services Offered
        "immediate_needs",
        "general_services",
        "health_services",
        "training_services",
        # Entry Requirements
        "entry_requirements",
        # Ecosystem Information
        "cities",
        "spa",
        "city_council_district",
        "supervisorial_district",
        "shelter_programs",
        "funders",
        # Better Angels Review
        "overall_rating",
        # Better Angels Administration
        "status",
    )
    search_fields = ("name", "organization__name", "description", "subjective_review")
    resource_class = ShelterResource

    def get_readonly_fields(
        self, request: HttpRequest, obj: Optional[Shelter] = None
    ) -> Union[list[str], Tuple[str, ...]]:
        readonly_fields = super().get_readonly_fields(request, obj)
        readonly_fields = (*readonly_fields, "updated_at", "updated_by")
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
            if import_type not in logentry_map:
                continue
            action_flag = logentry_map[import_type]
            self._create_log_entry(user_pk, rows[import_type], import_type, action_flag)

    def updated_by(self, obj: Shelter) -> str:
        last_event = (
            MiddlewareEvents.objects.filter(
                pgh_obj_id=obj.id,
            )
            .select_related("user")
            .order_by("-pgh_created_at")
            .first()
        )

        if last_event and last_event.user:
            user_admin_url = reverse(
                f"admin:{User._meta.app_label}_{User._meta.model_name}_change", args=[last_event.user.id]
            )
            return format_html(
                '<a href="{}">{}</a>', user_admin_url, last_event.user.full_name or last_event.user.username
            )

        return "No updates yet"


admin.site.register(Shelter, ShelterAdmin)
admin.site.register(ContactInfo)
