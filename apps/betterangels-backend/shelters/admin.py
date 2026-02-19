import json
import logging
from typing import Any, Optional, Tuple, Type, TypeVar, Union, cast
from urllib.parse import quote

import places
import requests
from betterangels_backend import settings
from common.models import Location
from django import forms
from django.contrib import admin, messages
from django.contrib.admin.models import ADDITION, CHANGE, DELETION
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import FieldDoesNotExist, ValidationError
from django.core.files.base import ContentFile
from django.db import models, transaction
from django.db.models import F, OuterRef, QuerySet, Subquery
from django.db.models.functions import Cast, JSONObject
from django.forms import BaseFormSet, TimeInput
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import gettext_lazy as _
from django_select2.forms import Select2MultipleWidget
from import_export import resources
from import_export.admin import ImportExportModelAdmin
from import_export.fields import Field
from import_export.results import RowResult
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from organizations.models import Organization
from pghistory.models import MiddlewareEvents
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    MealServiceChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from .models import (
    SPA,
    Accessibility,
    Bed,
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
    get_fields_with_other_option,
)

T = TypeVar("T", bound=models.Model)
logger = logging.getLogger(__name__)
User = get_user_model()


def create_other_text_field() -> forms.CharField:
    """
    Factory function to create consistent _other text fields.

    These fields are shown/hidden by JavaScript based on whether 'Other' is selected.
    """
    return forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "Please specify..."}),
    )


def create_select2_multiple_field(
    choices: Any,
    placeholder: str,
    required: bool = False,
    label: Optional[str] = None,
) -> forms.MultipleChoiceField:
    """
    Factory function to create consistent Select2 multiple choice fields.

    Args:
        choices: The enum choices for the field
        placeholder: Placeholder text shown in the widget
        required: Whether the field is required
        label: Optional custom label for the field

    Returns:
        A configured MultipleChoiceField with Select2 widget
    """
    field = forms.MultipleChoiceField(
        choices=choices,
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": placeholder,
                "data-allow-clear": "true",
            }
        ),
        required=required,
    )
    if label:
        field.label = label
    return field


class ShelterForm(forms.ModelForm):
    template_name = "admin/shelters/shelter/change_form.html"

    clear_hero_image = forms.BooleanField(
        required=False,
        label="Clear hero image",
        help_text="Check to remove the current hero image.",
    )

    # Summary Info
    demographics = create_select2_multiple_field(DemographicChoices, "Select demographics...", required=True)
    demographics_other = create_other_text_field()
    special_situation_restrictions = create_select2_multiple_field(
        SpecialSituationRestrictionChoices,
        "Select special situation restrictions...",
        required=True,
        label="Special Situation",
    )
    shelter_types = create_select2_multiple_field(ShelterChoices, "Select shelter types...")
    shelter_types_other = create_other_text_field()

    # Sleeping Details
    room_styles = create_select2_multiple_field(RoomStyleChoices, "Select room style...")
    room_styles_other = create_other_text_field()

    # Shelter Details
    accessibility = create_select2_multiple_field(AccessibilityChoices, "Select accessibility...")
    storage = create_select2_multiple_field(StorageChoices, "Select storage...", required=True)
    pets = create_select2_multiple_field(PetChoices, "Select pets...", required=True)
    parking = create_select2_multiple_field(ParkingChoices, "Select parking...", required=True)

    # Restrictions
    curfew = forms.TimeField(widget=TimeInput(attrs={"type": "time"}), required=False)

    # Services Offered
    immediate_needs = create_select2_multiple_field(ImmediateNeedChoices, "Select immediate needs...")
    general_services = create_select2_multiple_field(GeneralServiceChoices, "Select general services...")
    health_services = create_select2_multiple_field(HealthServiceChoices, "Select health services...")
    training_services = create_select2_multiple_field(TrainingServiceChoices, "Select training services...")

    # Entry Requirements
    entry_requirements = create_select2_multiple_field(EntryRequirementChoices, "Select entry requirements...")

    # Ecosystem Information
    spa = create_select2_multiple_field(SPAChoices, "Select SPA...")
    shelter_programs = create_select2_multiple_field(ShelterProgramChoices, "Select shelter programs...")
    shelter_programs_other = create_other_text_field()
    funders = create_select2_multiple_field(FunderChoices, "Select funders...")
    funders_other = create_other_text_field()

    # Cities field with Select2 widget for inline display
    cities = forms.ModelMultipleChoiceField(
        queryset=City.objects.all(),
        widget=Select2MultipleWidget(
            attrs={
                "data-placeholder": "Select cities...",
                "data-allow-clear": "true",
            }
        ),
        required=False,
    )

    exit_policy = create_select2_multiple_field(ExitPolicyChoices, "Select exit policies...")
    exit_policy_other = create_other_text_field()
    meal_services = create_select2_multiple_field(MealServiceChoices, "Select meal services...")
    referral_requirement = create_select2_multiple_field(ReferralRequirementChoices, "Select requirements...")

    class Meta:
        model = Shelter
        fields = "__all__"

    class Media:
        js = (
            "admin/js/jquery.init.js",
            "admin/js/dynamic_fields.js",
        )

    def clean(self) -> dict:
        """
        Validate form data including:
        1. Ensure all M2M choice objects exist in database
        2. Validate that _other fields are filled when 'Other' is selected
        """
        cleaned_data = super().clean() or {}

        # Process only ManyToMany fields where the related model uses TextChoices
        for field in self._meta.model._meta.get_fields():
            if not isinstance(field, models.ManyToManyField) or not isinstance(field.related_model, type):
                continue

            model_class = field.related_model
            try:
                name_field = model_class._meta.get_field("name")
                # Only process if the name field uses an enum (has choices_enum)
                if hasattr(name_field, "choices_enum"):
                    cleaned_data[field.name] = self._clean_choices(field.name, model_class)
            except FieldDoesNotExist:
                # If no name field, skip (like City which uses direct model)
                pass

        # Validate fields with "_other" using the centralized constant
        self._validate_other_fields(cleaned_data)

        return cleaned_data

    def _validate_other_fields(self, cleaned_data: dict) -> None:
        """Validate that _other fields are filled when 'Other' is selected."""
        for multi_field in get_fields_with_other_option():
            text_field = f"{multi_field}_other"
            multi_values = cleaned_data.get(multi_field, [])

            # Extract string names from model instances
            multi_value_names = [str(m.name).lower() for m in multi_values] if multi_values else []
            text_value = cleaned_data.get(text_field, "").strip()

            if "other" in multi_value_names and not text_value:
                self.add_error(
                    text_field,
                    f"This field is required when 'Other' is selected in {multi_field}.",
                )

    def _clean_choices(self, field_name: str, model_class: Type[T]) -> list[T]:
        """
        Ensure all selected choices exist in the related model, creating missing ones.

        This is necessary because the form uses TextChoices but the database
        stores foreign keys to the related models.

        Args:
            field_name: Name of the M2M field being processed
            model_class: The related model class

        Returns:
            List of model instances for the selected choices
        """
        choices = self.cleaned_data.get(field_name, [])

        if not choices:
            return []

        # Retrieve existing objects and their names
        existing_objects: list[T] = list(model_class.objects.filter(name__in=choices))  # type: ignore[attr-defined]
        existing_entries = {str(obj) for obj in existing_objects}

        # Create missing objects
        missing_choices = [model_class(name=choice) for choice in choices if choice not in existing_entries]
        if missing_choices:
            new_objects = model_class.objects.bulk_create(missing_choices)  # type: ignore[attr-defined]
            existing_objects.extend(new_objects)

        return existing_objects


@admin.register(ContactInfo)
class ContactInfoAdmin(admin.ModelAdmin):
    list_display = ("contact_name", "contact_number", "shelter")
    search_fields = ("contact_name", "contact_number")


class ContactInfoInline(admin.TabularInline):
    model = ContactInfo
    extra = 1
    fields = ["contact_name", "contact_number"]
    verbose_name = "Additional Contact"
    verbose_name_plural = "Additional Contacts"
    inline_key = "contactinfo"


class PhotoForm(forms.ModelForm):
    make_hero_image = forms.BooleanField(
        required=False,
        label="Make Hero Image",
    )

    class Meta:
        fields = "__all__"


class ExteriorPhotoForm(PhotoForm):
    class Meta(PhotoForm.Meta):
        model = ExteriorPhoto


class InteriorPhotoForm(PhotoForm):
    class Meta(PhotoForm.Meta):
        model = InteriorPhoto


class ExteriorPhotoInline(admin.TabularInline):
    model = ExteriorPhoto
    form = ExteriorPhotoForm
    max_num = 0


class InterPhotoInline(admin.TabularInline):
    model = InteriorPhoto
    form = InteriorPhotoForm
    max_num = 0


class VideoInline(admin.TabularInline):
    model = Video
    max_num = 0


class ShelterResource(resources.ModelResource):

    organization = Field(
        column_name="organization", attribute="organization", widget=ForeignKeyWidget(Organization, "name")
    )
    spa = Field(column_name="spa", attribute="spa", widget=ManyToManyWidget(SPA, separator=",", field="name"))
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
        widget=ManyToManyWidget(City, separator=",", field="display_name"),
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
    skip_row_not_val_error = True

    class Meta:
        model = Shelter
        import_id_fields = (
            "name",
            "organization",
        )
        exclude = ("id", "created_at", "updated_at")

    def skip_or_raise(self, row: Any, col_of_choice: str) -> None:
        logger.warning(f"Row {self.count}: Bad {col_of_choice} value")
        if self.skip_row_not_val_error:
            row[col_of_choice] = None
            row["jumpthis"] = True
        else:
            raise ValidationError(f"Row {self.count}: Bad {col_of_choice} value")

    def process_spa_import(self, row: Any, spa_row: str) -> None:
        spa_names = [v.strip() for v in spa_row.split(",")]
        spa_choices = {i for i in range(1, len(SPAChoices.choices) + 1)}
        for spa_name in spa_names:
            try:
                if int(spa_name) in spa_choices:
                    sp, createdSpa = SPA.objects.get_or_create(name=spa_name)
                else:
                    raise ValueError
            except ValueError:
                self.skip_or_raise(row, "spa")

    def process_address_import(self, row: Any, address_row: str) -> None:
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
            if addy_address is None or None in [
                addy_address.street,
                addy_address.city,
                addy_address.state,
                addy_address.zip_code,
            ]:
                raise IndexError
            row["location"] = addy_to_places_object
        except IndexError:
            self.skip_or_raise(row, "location")

    def process_many_to_many_import(self, row: Any, rowInDict: dict, column: str) -> None:
        """Process many-to-many imports with dynamic field lookup."""
        fieldModel = cast(Type[models.Model], Shelter._meta.get_field(column).related_model)

        try:
            name_field = fieldModel._meta.get_field("name")  # type: ignore
        except FieldDoesNotExist:
            self.skip_or_raise(row, column)
            return

        field_choices = name_field.choices  # type: ignore
        columnSeparateVals = [v.strip() for v in rowInDict[column].split(",")]
        # Build reverse mapping from choice display to choice value
        row_vals_choices: dict = {}
        if field_choices:
            for choice_value, choice_display in field_choices:
                row_vals_choices[choice_display] = choice_value
        for i, indVal in enumerate(columnSeparateVals):
            try:
                if indVal in row_vals_choices:
                    if row_vals_choices[indVal] == "other" and not rowInDict[f"{column}_other"]:
                        raise ValueError
                    brand_new_obj, createdNewObjectInModel = fieldModel.objects.get_or_create(  # type: ignore[attr-defined]
                        name=row_vals_choices[indVal]
                    )
                    columnSeparateVals[i] = row_vals_choices[indVal]
                else:
                    raise ValueError
            except ValueError:
                self.skip_or_raise(row, column)
        row[column] = ",".join(columnSeparateVals)

    def process_contact_info(self, row: Any, contact_info_row: str) -> None:
        try:
            columnSeparateVals = [(v.strip()).split(":") for v in contact_info_row.split(",")]
        except ValueError:
            self.skip_or_raise(row, "additional_contacts")
        row["additional_contacts"] = columnSeparateVals

    def before_import_row(self, row: Any, **kwargs: Any) -> None:
        self.count += 1
        if self.skip_row_not_val_error:
            row["jumpthis"] = False

        # This for loop checks for fields that have exceeded their max length
        for field in Shelter._meta.get_fields():
            if hasattr(field, "max_length") and field.max_length:
                fieldname = field.name
                value = row.get(fieldname)
                if value and (len(value) > field.max_length):
                    self.skip_or_raise(row, fieldname)
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
            if rowInDict["status"] and rowInDict["status"] not in [j for _, j in StatusChoices.choices]:
                self.skip_or_raise(row, "status")
            if rowInDict["spa"]:
                self.process_spa_import(row, rowInDict["spa"])
            # Same idea as the handling for SPA, but uses existing get_or_create_address method in Location class to handle Address creation
            if rowInDict["location"]:
                self.process_address_import(row, rowInDict["location"])
            # This is to process the ManyToMany fields, grabs the data within the CSV and matches it to the proper choice for that column
            for column in customFields:
                if rowInDict[column]:
                    self.process_many_to_many_import(row, rowInDict, column)
            if rowInDict["additional_contacts"]:
                self.process_contact_info(row, rowInDict["additional_contacts"])
        else:
            logger.warning(f"No org name: {self.count} {row}")
            if self.skip_row_not_val_error:
                row["jumpthis"] = True
            else:
                raise ValidationError(f"Row {self.count} is missing an Organization")

    def after_save_instance(self, instance: Any, row: Any, **kwargs: Any) -> None:
        add_contact = row.get("additional_contacts")
        dry_run = kwargs.get("dry_run", False)
        if add_contact:
            for name, number in add_contact:
                if not dry_run:
                    ContactInfo.objects.get_or_create(shelter=instance, contact_name=name, contact_number=number)

    # Skips any row that has an error, based on whether or not "jumpthis" columns was set to True during
    # import, and also whether or not skip_row_not_val_error boolean is True or False
    def skip_row(self, instance: Any, original: Any, row: Any, import_validation_errors: Any | None = None) -> bool:
        if row.get("jumpthis"):
            return True
        return bool(super().skip_row(instance, original, row, import_validation_errors))


@admin.register(Shelter)
class ShelterAdmin(ImportExportModelAdmin):
    form = ShelterForm
    list_select_related = ("organization",)

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
                    "instagram",
                    "operating_hours",
                ),
            },
        ),
        (
            "Summary Info",
            {
                "fields": (
                    "demographics",
                    "demographics_other",
                    "special_situation_restrictions",
                    "shelter_types",
                    "shelter_types_other",
                    "description",
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
                    "add_notes_sleeping_details",
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
                    "add_notes_shelter_details",
                )
            },
        ),
        (
            "Policies",
            {
                "fields": (
                    "max_stay",
                    "intake_hours",
                    "curfew",
                    "on_site_security",
                    "visitors_allowed",
                    "exit_policy",
                    "exit_policy_other",
                    "emergency_surge",
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
                    "meal_services",
                    "other_services",
                )
            },
        ),
        (
            "Entry Requirements",
            {
                "fields": (
                    "entry_requirements",
                    "referral_requirement",
                    "bed_fees",
                    "program_fees",
                    "entry_info",
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
                    "declined_ba_visit",
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
        "declined_ba_visit",
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

    def _get_selected_hero(self, formsets: list[BaseFormSet]) -> Optional[Union[Type[models.Model], models.Model]]:
        return next(
            (
                f.instance
                for fs in formsets
                for f in fs.forms
                if f.cleaned_data and not f.cleaned_data.get("DELETE") and f.cleaned_data.get("make_hero_image")
            ),
            None,
        )

    def _get_m2m_permissions(self, action: str = "change") -> dict[str, str]:
        """
        Generates a dict of permission names by related_name key for all ManyToManyFields on the Shelter model.
        """
        permissions_map = {}
        for field in Shelter._meta.get_fields():
            if isinstance(field, models.ManyToManyField):
                related_model = cast(Type[models.Model], field.related_model)
                model_name = related_model._meta.model_name  # singular name
                permission_codename = f"{action}_{model_name}"
                permissions_map[field.name] = f"shelters.{permission_codename}"

        return permissions_map

    def _create_log_entries(self, user_pk: int, rows: dict) -> None:
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

    def get_readonly_fields(
        self, request: HttpRequest, obj: Optional[Shelter] = None
    ) -> Union[list[str], Tuple[str, ...]]:
        readonly_fields = super().get_readonly_fields(request, obj)
        readonly_fields = (*readonly_fields, "updated_at", "updated_by")
        if not request.user.has_perm(ShelterFieldPermissions.CHANGE_IS_REVIEWED):
            readonly_fields = (*readonly_fields, "is_reviewed")

        all_permissions = request.user.get_all_permissions()

        if no_permission_fields := [
            field_name for field_name, perm in self._get_m2m_permissions().items() if perm not in all_permissions
        ]:
            readonly_fields = (*readonly_fields, *no_permission_fields)

        return readonly_fields

    def get_queryset(self, request: HttpRequest) -> QuerySet[Shelter]:
        qs: QuerySet[Shelter] = super().get_queryset(request)

        # Limit events to just the objects in *this* queryset (admin page w/ filters)
        # This uses pghistory's optimized aggregator instead of scanning all events.
        scoped_events = (
            MiddlewareEvents.objects.tracks(qs)
            .exclude(user__isnull=True)
            .order_by("pgh_obj_id", "-pgh_created_at")
            .distinct("pgh_obj_id")
            .annotate(
                obj=JSONObject(
                    user_id=F("user_id"),
                    created=F("pgh_created_at"),
                    first=F("user__first_name"),
                    last=F("user__last_name"),
                    username=F("user__username"),
                )
            )
        )

        return qs.annotate(
            last_event=Subquery(
                scoped_events.filter(pgh_obj_id=Cast(OuterRef("pk"), output_field=models.TextField())).values("obj")[:1]
            )
        )

    def save_related(
        self,
        request: HttpRequest,
        form: ShelterForm,
        formsets: list[BaseFormSet],
        change: bool,
    ) -> None:
        super().save_related(request, form, formsets, change)

        if form.cleaned_data.get("clear_hero_image"):
            form.instance.hero_image_content_type = None
            form.instance.hero_image_object_id = None
            form.instance.save()

        if hero := self._get_selected_hero(formsets):
            ct = ContentType.objects.get_for_model(hero)
            form.instance.hero_image_content_type = ct
            form.instance.hero_image_object_id = hero.pk
            form.instance.save()

    @admin.display(description="Current Hero Image")
    def display_hero_image(self, obj: Shelter) -> str:
        if obj.hero_image and obj.hero_image.file:
            return mark_safe(f'<img src="{obj.hero_image.file.url}" style="max-height: 200px;" />')

        return "No hero image selected"

    def updated_by(self, obj: Shelter) -> str:
        data = getattr(obj, "last_event", None) or {}
        uid = data.get("user_id")
        if not uid:
            return "No updates yet"
        name = f'{(data.get("first") or "").strip()} {(data.get("last") or "").strip()}'.strip()
        label = name or (data.get("username") or f"User {uid}")
        url = reverse(f"admin:{User._meta.app_label}_{User._meta.model_name}_change", args=[uid])
        return format_html('<a href="{}">{}</a>', url, label)


@admin.register(Bed)
class BedAdmin(admin.ModelAdmin):
    list_display = ("id", "shelter_id", "status", "created_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("shelter_id__name",)

    def get_urls(self) -> list[Any]:
        urls = super().get_urls()
        custom_urls: list[Any] = [
            path(
                "<path:object_id>/clone/",
                self.admin_site.admin_view(self.clone_view),
                name="shelters_shelter_clone",
            ),
        ]
        return custom_urls + urls

    def _copy_file_field(self, original_file_field: Any) -> Optional[ContentFile]:
        """Return a duplicated ContentFile with '_copy' suffix, or None if source is empty."""
        if not original_file_field or not original_file_field.name:
            return None

        original_file = original_file_field.file
        original_name = original_file_field.name

        name_parts = original_name.rsplit(".", 1)
        new_name = f"{name_parts[0]}_copy.{name_parts[1]}" if len(name_parts) == 2 else f"{original_name}_copy"

        original_file.seek(0)
        return ContentFile(original_file.read(), name=new_name)

    def _clone_objects_with_files(
        self, queryset: QuerySet[Union[ExteriorPhoto, InteriorPhoto, Video]], copy: Shelter
    ) -> None:
        """Clone objects with shelter and file fields, duplicating files."""
        for obj in queryset:
            obj.pk = None
            obj.shelter = copy
            content_file = self._copy_file_field(obj.file)
            if content_file:
                obj.file = content_file
            obj.save()

    def _clone_related_photos_and_videos(self, original: Shelter, copy: Shelter) -> None:
        """Clone photos and videos with file duplication and metadata preservation."""
        for model_class in (ExteriorPhoto, InteriorPhoto, Video):
            self._clone_objects_with_files(model_class.objects.filter(shelter=original), copy)

    def _clone_related_contacts(self, original: Shelter, copy: Shelter) -> None:
        """Clone additional contacts."""
        for contact in ContactInfo.objects.filter(shelter=original):
            contact.pk = None
            contact.shelter = copy
            contact.save()

    def _clone_many_to_many_fields(self, original: Shelter, copy: Shelter) -> None:
        """Copy all many-to-many relationships."""
        for field in Shelter._meta.get_fields():
            if isinstance(field, models.ManyToManyField):
                getattr(copy, field.name).set(getattr(original, field.name).all())

    def clone_view(self, request: HttpRequest, object_id: str) -> HttpResponseRedirect:
        """Clone a shelter instance with all related objects."""
        shelter = self.get_object(request, object_id)
        if shelter is None or not self.has_change_permission(request, shelter):
            msg = (
                f'{self.opts.verbose_name} with ID "{object_id}" is unavailable or you do not have '
                "permission to access it."
            )
            self.message_user(request, msg, messages.WARNING)
            return HttpResponseRedirect(reverse("admin:index", current_app=self.admin_site.name))

        if not self.has_add_permission(request):
            msg = (
                f"You do not have permission to add {str(self.opts.verbose_name).lower()} instances. "
                "Cloning requires add permission."
            )
            self.message_user(request, msg, messages.WARNING)
            return HttpResponseRedirect(reverse("admin:index", current_app=self.admin_site.name))

        with transaction.atomic():
            # Create a copy of the shelter
            shelter_copy = Shelter.objects.get(pk=shelter.pk)
            shelter_copy.pk = None
            shelter_copy.name = f"{shelter.name} (Copy)"
            shelter_copy.status = StatusChoices.PENDING
            shelter_copy.save()

            # Clone all related data
            self._clone_many_to_many_fields(shelter, shelter_copy)
            self._clone_related_contacts(shelter, shelter_copy)
            self._clone_related_photos_and_videos(shelter, shelter_copy)

        messages.success(request, _("Shelter '%s' has been cloned successfully.") % shelter.name)
        return redirect("admin:shelters_shelter_change", shelter_copy.pk)


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    """Admin interface for managing cities."""

    list_display = ("name", "created_at")
    search_fields = ("name",)
    readonly_fields = ("created_at",)
    ordering = ("name",)
