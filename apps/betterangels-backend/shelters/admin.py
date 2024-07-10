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

    def clean_populations(self) -> list[Population]:
        return self._clean_choices("populations", Population)

    def clean_shelter_types(self) -> list[ShelterType]:
        return self._clean_choices("shelter_types", ShelterType)

    def clean_immediate_needs(self) -> list[ImmediateNeed]:
        return self._clean_choices("immediate_needs", ImmediateNeed)

    def clean_general_services(self) -> list[GeneralService]:
        return self._clean_choices("general_services", GeneralService)

    def clean_health_services(self) -> list[HealthService]:
        return self._clean_choices("health_services", HealthService)

    def clean_career_services(self) -> list[CareerService]:
        return self._clean_choices("career_services", CareerService)

    def clean_funders(self) -> list[Funder]:
        return self._clean_choices("funders", Funder)

    def clean_accessibility(self) -> list[Accessibility]:
        return self._clean_choices("accessibility", Accessibility)

    def clean_storage(self) -> list[Storage]:
        return self._clean_choices("storage", Storage)

    def clean_parking(self) -> list[Parking]:
        return self._clean_choices("parking", Parking)

    def clean_entry_requirements(self) -> list[EntryRequirement]:
        return self._clean_choices("entry_requirements", EntryRequirement)

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
