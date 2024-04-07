from django.contrib import admin

from .models import HowToEnter, Shelter, Service, Population, Requirement, \
    ShelterType, Location


class LocationInline(admin.TabularInline):
    model = Location


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


class ShelterAdmin(admin.ModelAdmin):
    inlines = [
        PopulationInline,
        ServiceInline,
        ShelterTypeInline,
        RequirementInline,
        HowToEnterInline,
        # LocationInline
    ]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "title",
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


admin.site.register(Location)
admin.site.register(Shelter, ShelterAdmin)
