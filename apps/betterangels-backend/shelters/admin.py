from typing import Any, Optional, Type, TypeVar, cast

from common.admin import AttachmentInline
from common.managers import AttachmentQuerySet
from common.models import Attachment
from django import forms
from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple, ModelForm, SelectMultiple, TimeInput
from django.http import HttpRequest

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
    StorageChoices,
)
from .models import (
    Accessibility,
    Attachment,
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


class BaseAttachmentForm(ModelForm):
    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.initial_file = self.instance.file if self.instance.pk else None

    def save(self, commit: bool = True) -> Attachment:
        new_attachment: Attachment = super().save(commit=commit)

        # If there was an initial file and a new file has been uploaded
        if self.initial_file and self.initial_file != new_attachment.file:
            self.initial_file.delete(save=False)

        return new_attachment


class HeroInine(AttachmentInline):
    class HeroForm(BaseAttachmentForm):
        def save(self, commit: bool = True) -> Attachment:
            self.instance.namespace = "hero_image"
            return super().save(commit=commit)

    form = HeroForm
    max_num = 1
    verbose_name = "Hero Image"
    verbose_name_plural = "Hero Image"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        return cast(AttachmentQuerySet, super().get_queryset(request)).hero_image()


class PhotoInline(AttachmentInline):
    verbose_name = "Photo"
    verbose_name_plural = "Photos"
    form = BaseAttachmentForm

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        return cast(AttachmentQuerySet, super().get_queryset(request)).images().exclude(namespace="hero_image")


class VideoInline(AttachmentInline):
    verbose_name = "Video"
    verbose_name_plural = "Videos"
    form = BaseAttachmentForm

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        return cast(AttachmentQuerySet, super().get_queryset(request)).videos()


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
            "pets": Pet,
            "sleeping_options": SleepingOption,
        }
        for field_name, model_class in fields_to_clean.items():
            cleaned_data[field_name] = self._clean_choices(field_name, model_class)
        return cleaned_data

    def _clean_choices(self, field_name: str, model_class: Type[T]) -> list[T]:
        choices: list[str] = self.cleaned_data.get(field_name, [])
        entries: list[T] = []
        for choice in choices:
            obj, _ = model_class.objects.get_or_create(name=choice)  # type: ignore[attr-defined]
            entries.append(obj)
        return entries


class ShelterAdmin(admin.ModelAdmin):
    form = ShelterForm
    inlines = [
        HeroInine,
        PhotoInline,
        VideoInline,
    ]

    change_form_template = "admin/shelter/change_form.html"

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
                    "curfew",
                    "max_stay",
                )
            },
        ),
        (
            "Restrictions",
            {"fields": ("entry_requirements", "cities", "city_district", "supervisorial_district", "spa", "pets")},
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
        ("Visuals", {"fields": ()}),
    )

    list_display = ("name", "organization", "address", "phone", "email", "website")
    search_fields = ("name", "organization__name")


admin.site.register(Shelter, ShelterAdmin)
