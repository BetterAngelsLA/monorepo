from django.contrib import admin
from hmis.models import HmisClientProfile, HmisNote
from rangefilter.filters import DateRangeFilterBuilder


@admin.register(HmisClientProfile)
class HmisClientProfileAdmin(admin.ModelAdmin):
    list_display = ("hmis_id", "first_name", "last_name", "email")
    search_fields = ("hmis_id", "email", "last_name")


@admin.register(HmisNote)
class HmisNoteAdmin(admin.ModelAdmin):

    list_display = (
        "hmis_id",
        "date",
        "title",
        "get_client_profile",
        "created_by",
        "added_date",
    )

    list_filter = (
        ("date", DateRangeFilterBuilder()),
        ("added_date", DateRangeFilterBuilder()),
        "created_by",
    )

    search_fields = (
        "hmis_id",
        "title",
        "note",
        "hmis_client_profile__hmis_id",
        "hmis_client_profile__first_name",
        "hmis_client_profile__last_name",
        "hmis_client_profile__email",
        "created_by__email",
        "created_by__first_name",
        "created_by__last_name",
    )

    autocomplete_fields = ["hmis_client_profile", "created_by"]

    readonly_fields = (
        "added_date",
        "last_updated",
    )

    @admin.display(description="Client", ordering="hmis_client_profile")
    def get_client_profile(self, obj: HmisNote) -> str:
        return str(obj.hmis_client_profile)
