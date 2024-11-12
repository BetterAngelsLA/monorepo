from typing import Optional, Tuple, Type, TypeVar, Union

from django import forms
from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple, SelectMultiple, TimeInput
from django.http import HttpRequest
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
    ShelterChoices,
    SPAChoices,
    StorageChoices,
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
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    TrainingService,
)

T = TypeVar("T", bound=models.Model)


class ShelterForm(forms.ModelForm):
    curfew = forms.TimeField(widget=TimeInput(attrs={"type": "time"}), required=False)

    # Summary Info
    demographics = forms.MultipleChoiceField(choices=DemographicChoices, widget=CheckboxSelectMultiple(), required=True)

    #################
    #################
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
            ########
            "immediate_needs": ImmediateNeed,
            "general_services": GeneralService,
            "health_services": HealthService,
            "career_services": TrainingService,
            "funders": Funder,
            "entry_requirements": EntryRequirement,
            "cities": City,
            "spa": SPA,
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
        # "how_to_enter", "mandatory_worship_attendance"
        # (
        #     "Advanced Info",
        #     {
        #         "fields": (
        #             "shelter_types",
        #             "populations",
        #             "immediate_needs",
        #             "general_services",
        #             "health_services",
        #             "career_services",
        #             "funders",
        #
        #         )
        #     },
        # ),
        # (
        #     "Restrictions",
        #     {
        #         "fields": (
        #             "entry_requirements",
        #             "cities",
        #             "city_district",
        #             "supervisorial_district",
        #             "spa",
        #
        #             "curfew",
        #             "max_stay",
        #             "security",
        #             "drugs",
        #             "program_fees",
        #         )
        #     },
        # ),
        # (
        #     "Beds",
        #     {
        #         "fields": (
        #             "fees",
        #
        #             "sleeping_options",
        #         )
        #     },
        # ),
        # ("BA Administration", {"fields": ("is_reviewed",)}),
    )

    # list_display = ("name", "organization", "address", "phone", "email", "website", "is_reviewed")
    # list_filter = ("is_reviewed",)
    search_fields = ("name", "organization__name")

    # def get_readonly_fields(
    #     self, request: HttpRequest, obj: Optional[Shelter] = None
    # ) -> Union[list[str], Tuple[str, ...]]:
    #     readonly_fields = super().get_readonly_fields(request, obj)
    #     if not request.user.has_perm(ShelterFieldPermissions.CHANGE_IS_REVIEWED):
    #         readonly_fields = (*readonly_fields, "is_reviewed")
    #     return readonly_fields


admin.site.register(Shelter, ShelterAdmin)
