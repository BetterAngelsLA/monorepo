from django.contrib import admin

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


class ShelterAdmin(admin.ModelAdmin):
    inlines = [
        FunderInline,
        PopulationInline,
        ServiceInline,
        ShelterTypeInline,
        RequirementInline,
        HowToEnterInline,
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
    search_fields = ("title",)


admin.site.register(Location, LocationAdmin)
admin.site.register(Shelter, ShelterAdmin)
