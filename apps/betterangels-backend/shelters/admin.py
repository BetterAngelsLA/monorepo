from typing import Optional, Tuple, Type, TypeVar, Union

from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import models
from django.forms import CheckboxSelectMultiple, SelectMultiple, TimeInput
from django.http import HttpRequest
from django.urls import reverse
from django.utils.html import format_html
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
from .models import (
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    Parking,
    Pet,
    RoomStyle,
    Shelter,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)

T = TypeVar("T", bound=models.Model)
User = get_user_model()


class ShelterForm(forms.ModelForm):
    curfew = forms.TimeField(widget=TimeInput(attrs={"type": "time"}), required=False)

    # Summary Info
    demographics = forms.MultipleChoiceField(choices=DemographicChoices, widget=CheckboxSelectMultiple(), required=True)
    special_situation_restrictions = forms.MultipleChoiceField(
        choices=SpecialSituationRestrictionChoices, widget=CheckboxSelectMultiple(), required=True
    )
    shelter_types = forms.MultipleChoiceField(choices=ShelterChoices, widget=CheckboxSelectMultiple(), required=False)

    # Sleeping Details
    room_styles = forms.MultipleChoiceField(choices=RoomStyleChoices, widget=CheckboxSelectMultiple(), required=False)

    # Shelter Details
    accessibility = forms.MultipleChoiceField(
        choices=AccessibilityChoices, widget=CheckboxSelectMultiple(), required=False
    )
    storage = forms.MultipleChoiceField(choices=StorageChoices, widget=CheckboxSelectMultiple(), required=False)
    pets = forms.MultipleChoiceField(choices=PetChoices, widget=CheckboxSelectMultiple(), required=False)
    parking = forms.MultipleChoiceField(choices=ParkingChoices, widget=CheckboxSelectMultiple(), required=False)

    # Services Offered
    immediate_needs = forms.MultipleChoiceField(
        choices=ImmediateNeedChoices, widget=CheckboxSelectMultiple(), required=False
    )
    general_services = forms.MultipleChoiceField(
        choices=GeneralServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )
    health_services = forms.MultipleChoiceField(
        choices=HealthServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )
    training_services = forms.MultipleChoiceField(
        choices=TrainingServiceChoices, widget=CheckboxSelectMultiple(), required=False
    )

    # Entry Requirements
    entry_requirements = forms.MultipleChoiceField(
        choices=EntryRequirementChoices, widget=CheckboxSelectMultiple(), required=False
    )
    funders = forms.MultipleChoiceField(choices=FunderChoices, widget=CheckboxSelectMultiple(), required=False)

    # Ecosystem Information
    cities = forms.MultipleChoiceField(choices=CityChoices, widget=SelectMultiple(), required=False)
    spa = forms.MultipleChoiceField(choices=SPAChoices, widget=SelectMultiple(), required=False)
    shelter_programs = forms.MultipleChoiceField(
        choices=ShelterProgramChoices, widget=CheckboxSelectMultiple(), required=False
    )

    class Meta:
        model = Shelter
        fields = "__all__"

    def clean(self) -> dict:
        cleaned_data = super().clean() or {}
        fields_to_clean = {
            # Summary Info
            "demographics": Demographic,
            "special_situation_restrictions": SpecialSituationRestriction,
            "shelter_types": ShelterType,
            # Sleeping Details
            "room_styles": RoomStyle,
            # Shelter Details
            "accessibility": Accessibility,
            "storage": Storage,
            "pets": Pet,
            "parking": Parking,
            # Services Offered
            "immediate_needs": ImmediateNeed,
            "general_services": GeneralService,
            "health_services": HealthService,
            "training_services": TrainingService,
            # Entry Requirements
            "entry_requirements": EntryRequirement,
            # Ecosystem Information
            "cities": City,
            "spa": SPA,
            "shelter_programs": ShelterProgram,
            "funders": Funder,
            # Better Angels Admin
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


class ShelterAdmin(admin.ModelAdmin):
    form = ShelterForm

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("name", "organization", "address", "email", "phone", "website"),
            },
        ),
        (
            "Summary Info",
            {"fields": ("description", "demographics", "special_situation_restrictions", "shelter_types")},
        ),
        ("Sleeping Details", {"fields": ("total_beds", "room_styles")}),
        (
            "Shelter Details",
            {"fields": ("accessibility", "storage", "pets", "parking")},
        ),
        ("Restrictions", {"fields": ("max_stay", "curfew", "on_site_security", "other_rules")}),
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
                    "funders",
                )
            },
        ),
        (
            "Better Angels Review",
            {"fields": ("overall_rating", "subjective_review")},
        ),
        (
            "Better Angels Administration",
            {"fields": ("status", "updated_at", "updated_by")},
        ),
    )

    # list_display = ("name", "organization", "address", "phone", "email", "website", "is_reviewed")
    # list_filter = ("is_reviewed",)
    search_fields = ("name", "organization__name")

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
