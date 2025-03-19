from typing import Optional, cast

from clients.enums import LivingSituationEnum, RelationshipTypeEnum
from common.models import PhoneNumber
from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.db.models import Q, QuerySet
from django.urls import reverse
from django.utils.html import format_html
from import_export import fields, resources
from import_export.admin import ExportActionMixin
from import_export.formats.base_formats import CSV
from pghistory.models import Events

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    ClientProfileDataImport,
    ClientProfileImportRecord,
    HmisProfile,
)


class HmisProfileInline(admin.TabularInline):
    model = HmisProfile
    extra = 1


class ClientContactInline(admin.TabularInline):
    model = ClientContact
    extra = 1


class ClientHouseholdMemberInline(admin.TabularInline):
    model = ClientHouseholdMember
    extra = 1


class PhoneNumberInline(GenericTabularInline):
    model = PhoneNumber
    extra = 1


class ClientProfileResource(resources.ModelResource):
    id = fields.Field(column_name="Client ID")
    created_at = fields.Field(column_name="Created On")
    updated_at = fields.Field(column_name="Updated On")
    living_situation_initial = fields.Field(column_name="Living Situation, Initial")
    living_situation_current = fields.Field(column_name="Living Situation, Most Recent")
    gender = fields.Field(column_name="Gender")
    pronouns = fields.Field(column_name="Pronouns")
    race = fields.Field(column_name="Race")
    place_of_birth = fields.Field(column_name="Place of Birth")
    ada_accommodation = fields.Field(column_name="ADA Accommodation")
    has_contact_info = fields.Field(column_name="Contact Info Available")
    has_case_manager_info = fields.Field(column_name="Case Manager Reachable")
    household_size = fields.Field(column_name="Household Size")

    class Meta:
        model = ClientProfile
        fields = (
            "id",
            "created_at",
            "updated_at",
            "living_situation_initial",
            "living_situation_current",
            "gender",
            "pronouns",
            "race",
            "place_of_birth",
            "ada_accommodation",
            "has_contact_info",
            "has_case_manager_info",
            "household_size",
        )

    def get_queryset(self) -> QuerySet[ClientProfile]:
        qs = cast(QuerySet[ClientProfile], super().get_queryset())

        return qs.select_related("user").prefetch_related(
            "contacts",
            "household_members",
            "phone_numbers",
            "social_media_profiles",
        )

    def dehydrate_id(self, obj: ClientProfile) -> int:
        return obj.pk

    def dehydrate_created_at(self, obj: ClientProfile) -> str:
        return obj.created_at.date().isoformat()

    def dehydrate_updated_at(self, obj: ClientProfile) -> str:
        return obj.updated_at.date().isoformat()

    def dehydrate_gender(self, obj: ClientProfile) -> Optional[str]:
        return obj.display_gender

    def dehydrate_pronouns(self, obj: ClientProfile) -> Optional[str]:
        return obj.display_pronouns

    def dehydrate_race(self, obj: ClientProfile) -> Optional[str]:
        return obj.get_race_display()

    def dehydrate_place_of_birth(self, obj: ClientProfile) -> Optional[str]:
        return obj.place_of_birth

    def dehydrate_ada_accommodation(self, obj: ClientProfile) -> Optional[str]:
        return ", ".join(str(a.label) for a in obj.ada_accommodation) if obj.ada_accommodation else None

    def dehydrate_has_contact_info(self, obj: ClientProfile) -> str:
        if (
            obj.user.email
            or obj.phone_numbers.exists()
            or obj.social_media_profiles.exists()
            or obj.mailing_address
            or obj.residence_address
        ):
            return "Yes"

        return "No"

    def dehydrate_has_case_manager_info(self, obj: ClientProfile) -> str:
        is_case_manager = Q(relationship_to_client=RelationshipTypeEnum.CURRENT_CASE_MANAGER)
        has_contact_info = Q(email__isnull=False) | Q(phone_number__isnull=False) | Q(mailing_address__isnull=False)

        if obj.contacts.filter(is_case_manager & has_contact_info).exists():
            return "Yes"

        return "No"

    def dehydrate_household_size(self, obj: ClientProfile) -> int:
        return obj.household_members.count()

    def dehydrate_living_situation_initial(self, obj: ClientProfile) -> Optional[str]:
        if first_living_situation_record := (
            Events.objects.filter(pgh_model="clients.ClientProfileEvent", pgh_obj_id=obj.pk)
            .exclude(pgh_data__living_situation=None)
            .order_by("pgh_created_at")
            .first()
        ):
            return LivingSituationEnum(first_living_situation_record.pgh_data["living_situation"]).label

        return None

    def dehydrate_living_situation_current(self, obj: ClientProfile) -> Optional[str]:
        return obj.get_living_situation_display()


@admin.register(ClientProfile)
class ClientProfileAdmin(ExportActionMixin, admin.ModelAdmin):
    resource_class = ClientProfileResource

    def get_export_formats(self) -> list:
        return [CSV]

    list_display = [
        "name",
        "id",
        "user__email",
        "user_id",
        "dob",
        "display_gender",
        "display_pronouns",
        "race",
        "eye_color",
        "hair_color",
        "preferred_language",
        "has_ca_id",
    ]
    inlines = [
        HmisProfileInline,
        ClientHouseholdMemberInline,
        ClientContactInline,
        PhoneNumberInline,
    ]

    def dob(self, obj: ClientProfile) -> Optional[str]:
        return obj.date_of_birth.isoformat() if obj.date_of_birth else None

    def has_ca_id(self, obj: ClientProfile) -> bool:
        return obj.california_id is not None

    def name(self, obj: ClientProfile) -> str:
        name_parts = list(filter(None, [obj.user.first_name, obj.user.middle_name, obj.user.last_name]))

        if obj.nickname:
            name_parts.append(f"({obj.nickname})")

        return " ".join(name_parts).strip()

    def user_id(self, obj: ClientProfile) -> str:
        return format_html(f'<a href="{reverse("admin:accounts_user_change", args=(obj.user.id,))}">{obj.user.id}</a>')

    search_fields = (
        "nickname",
        "user__email",
        "user__first_name",
        "user__last_name",
        "user__middle_name",
    )


# Data Import
@admin.register(ClientProfileDataImport)
class ClientProfileDataImportAdmin(admin.ModelAdmin):
    list_display = ("id", "imported_at", "source_file", "imported_by", "record_counts")
    readonly_fields = ("record_counts",)

    @admin.display(description="Import Record Counts")
    def record_counts(self, obj: ClientProfileDataImport) -> str:
        total = obj.records.count()
        successes = obj.records.filter(success=True).count()
        failures = total - successes
        return f"Total: {total} | Success: {successes} | Failures: {failures}"


@admin.register(ClientProfileImportRecord)
class ClientProfileImportRecordAdmin(admin.ModelAdmin):
    list_display = ("import_job__id", "source_name", "source_id", "client_profile", "success", "created_at")
    list_filter = ("import_job__id", "success")
    search_fields = ("source_id", "client_profile__id")
    readonly_fields = ("raw_data", "error_message")
