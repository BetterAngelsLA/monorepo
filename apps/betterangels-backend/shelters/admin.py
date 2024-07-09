from random import choices
from typing import cast

from common.admin import AttachmentInline, SingleAttachmentInline
from common.managers import AttachmentQuerySet
from common.models import Attachment
from common.widgets import CustomManyToManyField
from django import forms
from django.contrib import admin
from django.db.models import CharField, ManyToManyField
from django.forms import CheckboxSelectMultiple, ModelForm, model_to_dict
from django.http import HttpRequest
from shelters.enums import PopulationEnum

from .forms import LocationAdminForm
from .models import (
    EntryRequirement,
    Funder,
    Location,
    Population,
    Service,
    Shelter,
    ShelterType,
)


class PopulationInline(admin.TabularInline):
    model = Population


class ServiceInline(admin.TabularInline):
    model = Service


class ShelterTypeInline(admin.TabularInline):
    model = ShelterType


class RequirementInline(admin.TabularInline):
    model = EntryRequirement


class LocationAdmin(admin.ModelAdmin):
    form = LocationAdminForm


class FunderInline(admin.TabularInline):
    model = Funder
    verbose_name_plural = "Funders"


class HeroInine(SingleAttachmentInline):
    verbose_name = "Hero Image"
    verbose_name_plural = "Hero Image"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request))
        return qs.hero_image()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])  # Convert instance to dict and exclude the primary key
        return Attachment.hero_image.create(**data)


class PhotoInline(AttachmentInline):
    verbose_name = "Photo"
    verbose_name_plural = "Photos"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request)).exclude(namespace="hero_image")
        return qs.images()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])  # Convert instance to dict and exclude the primary key
        return Attachment.images.create(**data)


class VideoInline(AttachmentInline):
    verbose_name = "Video"
    verbose_name_plural = "Videos"

    def get_queryset(self, request: HttpRequest) -> AttachmentQuerySet:
        qs = cast(AttachmentQuerySet, super().get_queryset(request))
        return qs.videos()

    def save_new(self, form: ModelForm, commit: bool = True) -> Attachment:
        instance = form.save(commit=False)
        data = model_to_dict(instance, exclude=["id"])  # Convert instance to dict and exclude the primary key
        return Attachment.videos.create(**data)


class ShelterForm(forms.ModelForm):

    class Meta:
        Model = Shelter
        widgets = {
            "testing_populations": forms.SelectMultiple(choices=PopulationEnum),
        }


class ShelterAdmin(admin.ModelAdmin):
    form = ShelterForm
    inlines = [
        FunderInline,
        PopulationInline,
        ServiceInline,
        ShelterTypeInline,
        RequirementInline,
        HeroInine,
        PhotoInline,
        VideoInline,
    ]

    change_form_template = "admin/shelter/change_form.html"

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": ("title", "organization", "email", "phone", "website", "testing_populations"),
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
        ("Advanced Info", {"fields": ()}),
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
