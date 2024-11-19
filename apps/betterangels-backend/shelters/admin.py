from typing import Optional, Tuple, Type, TypeVar, Union

from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import models
from django.forms import TimeInput
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
from django_select2.forms import Select2MultipleWidget
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
    StorageChoices,
    TrainingServiceChoices,
)
from .models import ContactInfo, ExteriorPhoto, InteriorPhoto, Shelter, Video

T = TypeVar("T", bound=models.Model)
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


class ShelterAdmin(admin.ModelAdmin):
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

    def get_readonly_fields(
        self, request: HttpRequest, obj: Optional[Shelter] = None
    ) -> Union[list[str], Tuple[str, ...]]:
        readonly_fields = super().get_readonly_fields(request, obj)
        readonly_fields = (*readonly_fields, "updated_at", "updated_by")
        if not request.user.has_perm(ShelterFieldPermissions.CHANGE_IS_REVIEWED):
            readonly_fields = (*readonly_fields, "is_reviewed")
        return readonly_fields

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
