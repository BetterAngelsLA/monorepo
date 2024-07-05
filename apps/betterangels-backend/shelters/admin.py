from common.admin import AttachmentInline
from common.enums import AttachmentType
from common.models import Attachment
from django.contrib import admin
from django.db.models import QuerySet
from django.http import HttpRequest
from django.template.loader import get_template

from .forms import LocationAdminForm
from .models import (
    Funder,
    HowToEnter,
    Location,
    Population,
    Requirement,
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
    model = Requirement


class HowToEnterInline(admin.TabularInline):
    model = HowToEnter
    verbose_name_plural = "How to Enter"


class LocationAdmin(admin.ModelAdmin):
    form = LocationAdminForm


class FunderInline(admin.TabularInline):
    model = Funder
    verbose_name_plural = "Funders"


# class HeroImageInline(admin.StackedInline):
#     model = Attachment
#     fk_name = "content_object"
#     fields = ["file", "attachment_type"]
#     readonly_fields = ["attachment_type"]
#     extra = 0

#     def get_queryset(self, request: HttpRequest) -> QuerySet[Attachment]:
#         qs = super().get_queryset(request)
#         return qs.filter(attachment_type=AttachmentType.IMAGE, namespace="hero")


class PhotoInline(AttachmentInline):
    def get_queryset(self, request: HttpRequest) -> QuerySet[Attachment]:
        qs = super().get_queryset(request)
        return qs.filter(attachment_type=AttachmentType.IMAGE)

    verbose_name = "Photo"
    verbose_name_plural = "Photos"


class VideoInline(AttachmentInline):
    def get_queryset(self, request: HttpRequest) -> QuerySet[Attachment]:
        qs = super().get_queryset(request)
        return qs.filter(attachment_type=AttachmentType.VIDEO)

    verbose_name = "Video"
    verbose_name_plural = "Videos"


class ShelterAdmin(admin.ModelAdmin):
    inlines = [
        FunderInline,
        PopulationInline,
        ServiceInline,
        ShelterTypeInline,
        RequirementInline,
        HowToEnterInline,
        PhotoInline,
        VideoInline,
    ]

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
                    "organization",
                    "email",
                    "phone",
                    "website",
                    "image_url",
                ),
            },
        ),
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
            "Beds",
            {
                "fields": (
                    "total_beds",
                    "private_beds",
                    "average_bed_rate",
                    "bed_layout_description",
                )
            },
        ),
        (
            "Other Details",
            {
                "fields": (
                    "max_stay",
                    "description",
                    "typical_stay_description",
                )
            },
        ),
    )

    list_display = ("title",)
    # readonly_fields = ("image_inline",)
    search_fields = ("title",)


admin.site.register(Location, LocationAdmin)
admin.site.register(Shelter, ShelterAdmin)
