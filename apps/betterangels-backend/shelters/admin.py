from typing import Type, TypeVar

from django import forms
from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple, SelectMultiple, TimeInput

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
    spa = forms.MultipleChoiceField(choices=SPAChoices.choices, widget=SelectMultiple(), required=False)
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
        text_choice_fields_to_clean = {
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
            "pets": Pet,
            "sleeping_options": SleepingOption,
            "spa": SPA,
        }
        for field_name, model_class in text_choice_fields_to_clean.items():
            cleaned_data[field_name] = self._clean_choices(field_name, model_class)

        return cleaned_data

    def _clean_choices(self, field_name: str, model_class: Type[T]) -> list[T]:
        choices: list[str] = self.cleaned_data.get(field_name, [])

        if not choices:
            return []

        # Retrieve existing objects and their names
        existing_objects = list(model_class.objects.filter(name__in=choices))  # type: ignore[attr-defined]
        existing_entries = {str(obj.name.value) for obj in existing_objects}

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
    )

    list_display = ("name", "organization", "address", "phone", "email", "website")
    search_fields = ("name", "organization__name")


admin.site.register(Shelter, ShelterAdmin)
