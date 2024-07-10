from typing import Type, TypeVar, cast

from common.admin import AttachmentInline, SingleAttachmentInline
from common.managers import AttachmentQuerySet
from common.models import Attachment
from django import forms
from django.contrib import admin
from django.db import models
from django.forms import CheckboxSelectMultiple, ModelForm, model_to_dict
from django.http import HttpRequest

from .enums import (
    AccessibilityEnum,
    CareerServiceEnum,
    EntryRequirementEnum,
    FunderEnum,
    GeneralServiceEnum,
    HealthServiceEnum,
    ImmediateNeedEnum,
    ParkingEnum,
    PopulationEnum,
    ShelterTypeEnum,
    StorageEnum,
)
from .forms import LocationAdminForm
from .models import (
    Accessibility,
    CareerService,
    EntryRequirement,
    Funder,
    GeneralService,
    HealthService,
    ImmediateNeed,
    Location,
    Parking,
    Population,
    Shelter,
    ShelterType,
    Storage,
)


class LocationAdmin(admin.ModelAdmin):
    form = LocationAdminForm


class HeroInine(SingleAttachmentInline):
    verbose_name = "Hero Image"
    verbose_name_plural = "Hero Image"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request))
        return qs.hero_image()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])
        return Attachment.hero_image.create(**data)


class PhotoInline(AttachmentInline):
    verbose_name = "Photo"
    verbose_name_plural = "Photos"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request)).exclude(namespace="hero_image")
        return qs.images()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])
        return Attachment.images.create(**data)


class VideoInline(AttachmentInline):
    verbose_name = "Video"
    verbose_name_plural = "Videos"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request))
        return qs.videos()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])
        return Attachment.videos.create(**data)


T = TypeVar("T", bound=models.Model)


class ShelterForm(forms.ModelForm):
    # Advanced Info
    populations = forms.MultipleChoiceField(choices=PopulationEnum, widget=CheckboxSelectMultiple(), required=False)
    shelter_types = forms.MultipleChoiceField(choices=ShelterTypeEnum, widget=CheckboxSelectMultiple(), required=False)
    immediate_needs = forms.MultipleChoiceField(
        choices=ImmediateNeedEnum, widget=CheckboxSelectMultiple(), required=False
    )
    general_services = forms.MultipleChoiceField(
        choices=GeneralServiceEnum, widget=CheckboxSelectMultiple(), required=False
    )
    health_services = forms.MultipleChoiceField(
        choices=HealthServiceEnum, widget=CheckboxSelectMultiple(), required=False
    )
    career_services = forms.MultipleChoiceField(
        choices=CareerServiceEnum, widget=CheckboxSelectMultiple(), required=False
    )
    funders = forms.MultipleChoiceField(choices=FunderEnum, widget=CheckboxSelectMultiple(), required=False)
    accessibility = forms.MultipleChoiceField(
        choices=AccessibilityEnum, widget=CheckboxSelectMultiple(), required=False
    )
    storage = forms.MultipleChoiceField(choices=StorageEnum, widget=CheckboxSelectMultiple(), required=False)
    parking = forms.MultipleChoiceField(choices=ParkingEnum, widget=CheckboxSelectMultiple(), required=False)

    # Restrictions
    entry_requirements = forms.MultipleChoiceField(
        choices=EntryRequirementEnum, widget=CheckboxSelectMultiple(), required=False
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
                "fields": ("title", "organization", "email", "phone", "website"),
            },
        ),
        ("Other Details", {"fields": ()}),
        (
            "Location",
            {
                "fields": (
                    "location",
                    "confidential",
                    "spa",
                )
            },
        ),
        (
            "Advanced Info",
            {
                "fields": (
                    "populations",
                    "shelter_types",
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
        ("Restrictions", {"fields": ("entry_requirements",)}),
        (
            "Beds",
            {
                "fields": (
                    "total_beds",
                    "private_beds",
                    "bed_layout_description",
                )
            },
        ),
        ("Visuals", {"fields": ()}),
    )

    list_display = ("title",)
    search_fields = ("title",)


admin.site.register(Location, LocationAdmin)
admin.site.register(Shelter, ShelterAdmin)
