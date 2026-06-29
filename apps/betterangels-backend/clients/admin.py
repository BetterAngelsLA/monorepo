from typing import Optional, cast

from accounts.models import User
from clients.enums import (
    ClientDocumentNamespaceEnum,
    GenderEnum,
    LivingSituationEnum,
    RelationshipTypeEnum,
)
from clients.services.merge import MergeValidationError, execute_merge, preview_merge, undo_merge
from common.models import Attachment, PhoneNumber
from django.contrib import admin, messages
from django.contrib.contenttypes.admin import GenericTabularInline
from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, QuerySet
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils.encoding import force_str
from import_export import fields, resources
from import_export.admin import ExportActionMixin
from import_export.formats.base_formats import CSV
from pghistory.models import Events
from rangefilter.filters import DateRangeFilterBuilder

from .models import (
    ClientContact,
    ClientDocument,
    ClientHouseholdMember,
    ClientProfile,
    ClientProfileDataImport,
    ClientProfileImportRecord,
    HmisProfile,
    SocialMediaProfile,
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

        return qs.prefetch_related(
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
            obj.email
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
            return force_str(LivingSituationEnum(first_living_situation_record.pgh_data["living_situation"]).label)

        return None

    def dehydrate_living_situation_current(self, obj: ClientProfile) -> Optional[str]:
        return obj.get_living_situation_display()


@admin.register(ClientProfile)
class ClientProfileAdmin(ExportActionMixin, admin.ModelAdmin):
    resource_class = ClientProfileResource

    actions = ["merge_clients"]
    change_list_template = "admin/clients/clientprofile/change_list.html"
    change_form_template = "admin/clients/clientprofile/change_form.html"

    def get_export_formats(self) -> list:
        return [CSV]

    def get_queryset(self, request: HttpRequest) -> QuerySet[ClientProfile]:
        if request.GET.get("show_merged"):
            # Bypass the default manager (which hides merged profiles).
            return cast(QuerySet[ClientProfile], self.model._base_manager.all())
        return super().get_queryset(request)

    def change_view(
        self, request: HttpRequest, object_id: str, form_url: str = "", extra_context: dict | None = None
    ) -> HttpResponseRedirect | TemplateResponse:
        extra_context = extra_context or {}
        # Show undo link when this profile has sources merged into it.
        # Use including_merged() because merged sources are hidden by the
        # default manager.
        extra_context["merged_sources"] = list(
            ClientProfile.objects.including_merged().filter(merged_into_id=int(object_id))
        )
        return cast(
            HttpResponseRedirect | TemplateResponse,
            super().change_view(request, object_id, form_url, extra_context),
        )

    def get_urls(self) -> list:
        urls = super().get_urls()
        custom_urls = [
            path(
                "merge/",
                self.admin_site.admin_view(self.merge_view),
                name="clients_clientprofile_merge",
            ),
            path(
                "<int:pk>/merge/undo/",
                self.admin_site.admin_view(self.undo_merge_view),
                name="clients_clientprofile_undo_merge",
            ),
        ]
        return custom_urls + urls

    # ---- Merge action ----

    @admin.action(description="Merge selected clients")
    def merge_clients(self, request: HttpRequest, queryset: QuerySet[ClientProfile]) -> HttpResponseRedirect:
        if queryset.count() < 2:
            self.message_user(request, "Select at least 2 clients to merge.", messages.ERROR)
            return redirect(request.get_full_path())

        ids = ",".join(str(pk) for pk in queryset.values_list("pk", flat=True))
        return redirect(reverse("admin:clients_clientprofile_merge") + f"?ids={ids}")

    def merge_view(self, request: HttpRequest) -> HttpResponseRedirect | TemplateResponse:
        # Read ids from POST first (add-client form sends via hidden field),
        # then fall back to GET (initial action redirect uses query string).
        ids_param = request.POST.get("ids") or request.GET.get("ids", "")
        try:
            ids = [int(i) for i in ids_param.split(",") if i]
        except ValueError:
            self.message_user(request, "Invalid client IDs.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_changelist"))

        profiles = ClientProfile.objects.filter(pk__in=ids).order_by("pk") if ids else ClientProfile.objects.none()
        if ids and profiles.count() != len(ids):
            self.message_user(request, "Some selected clients no longer exist.", messages.WARNING)

        target_id = request.POST.get("target_id") or request.GET.get("target_id")
        is_preview = "preview" in request.POST
        is_confirm = "confirm" in request.POST

        # Step 0: Add client by ID (works even with no initial selection)
        if request.method == "POST" and "add_client_id" in request.POST:
            added_id_str = request.POST["add_client_id"].strip()
            try:
                added_id = int(added_id_str)
                if added_id not in ids:
                    try:
                        extra = ClientProfile.objects.get(pk=added_id)
                        ids.append(added_id)
                        profiles = ClientProfile.objects.filter(pk__in=ids).order_by("pk")
                        ids_param = ",".join(str(pk) for pk in ids)
                        self.message_user(
                            request,
                            f"Added '{extra.full_name}' (#{added_id}).",
                            messages.SUCCESS,
                        )
                    except ClientProfile.DoesNotExist:
                        self.message_user(
                            request,
                            f"Client #{added_id_str} not found.",
                            messages.ERROR,
                        )
            except ValueError:
                self.message_user(
                    request,
                    f"Invalid client ID: '{added_id_str}'.",
                    messages.ERROR,
                )

            # After adding, re-display the select target page
            return TemplateResponse(
                request,
                "admin/clients/clientprofile/merge_select_target.html",
                {
                    "profiles": profiles,
                    "ids": ids_param,
                    "opts": self.model._meta,
                    "title": "Merge Clients — Select Target",
                },
            )

        # Step 1: Select target page
        if request.method == "GET" and not target_id:
            return TemplateResponse(
                request,
                "admin/clients/clientprofile/merge_select_target.html",
                {
                    "profiles": profiles,
                    "ids": ids_param,
                    "opts": self.model._meta,
                    "title": "Merge Clients — Select Target",
                },
            )

        # --- Minimum check: 2+ profiles required for preview & confirm ---
        if profiles.count() < 2:
            self.message_user(request, "Add at least 2 clients to merge.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_merge") + (f"?ids={ids_param}" if ids_param else ""))

        # Step 2: Show preview
        if request.method == "POST" and is_preview:
            try:
                tid = int(cast(str, target_id))
            except ValueError, TypeError:
                self.message_user(request, "Please select a target profile.", messages.ERROR)
                return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

            source_ids = [p.pk for p in profiles if p.pk != tid]
            if not source_ids:
                self.message_user(
                    request, "Select at least one source profile (different from target).", messages.ERROR
                )
                return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}&target_id={tid}")

            try:
                preview = preview_merge(source_ids=source_ids, target_id=tid)
            except MergeValidationError as e:
                self.message_user(request, str(e), messages.ERROR)
                return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

            return TemplateResponse(
                request,
                "admin/clients/clientprofile/merge_preview.html",
                {
                    "preview": preview,
                    "ids": ids_param,
                    "opts": self.model._meta,
                    "title": "Merge Clients — Preview",
                },
            )

        # Step 3: Execute merge
        if request.method == "POST" and is_confirm:
            try:
                tid = int(cast(str, target_id))
            except ValueError, TypeError:
                self.message_user(request, "Invalid target ID.", messages.ERROR)
                return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

            source_ids = [p.pk for p in profiles if p.pk != tid]
            try:
                merged = execute_merge(
                    source_ids=source_ids,
                    target_id=tid,
                    performed_by=cast(User, request.user),
                )
            except MergeValidationError as e:
                self.message_user(request, str(e), messages.ERROR)
                return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

            self.message_user(
                request,
                f"Successfully merged {len(source_ids)} client(s) into '{merged.full_name}' (#{merged.pk}).",
                messages.SUCCESS,
            )
            return redirect(reverse("admin:clients_clientprofile_change", args=[merged.pk]))

        # Fallback
        return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

    # ---- Undo merge ----

    def undo_merge_view(self, request: HttpRequest, pk: int) -> HttpResponseRedirect | TemplateResponse:
        try:
            target = ClientProfile.objects.including_merged().get(pk=pk)
        except ClientProfile.DoesNotExist:
            self.message_user(request, "Client not found.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_changelist"))

        sources = ClientProfile.objects.including_merged().filter(merged_into=target)
        if not sources:
            self.message_user(request, "No merged sources to undo.", messages.WARNING)
            return redirect(reverse("admin:clients_clientprofile_change", args=[pk]))

        if request.method == "POST" and "confirm_undo" in request.POST:
            try:
                restored = undo_merge(target_id=pk, performed_by=cast(User, request.user))
            except MergeValidationError as e:
                self.message_user(request, str(e), messages.ERROR)
                return redirect(reverse("admin:clients_clientprofile_change", args=[pk]))

            names = ", ".join(p.full_name or f"#{p.pk}" for p in restored)
            self.message_user(
                request,
                f"Successfully restored: {names}.",
                messages.SUCCESS,
            )
            return redirect(reverse("admin:clients_clientprofile_change", args=[pk]))

        return TemplateResponse(
            request,
            "admin/clients/clientprofile/merge_undo.html",
            {
                "target": target,
                "sources": sources,
                "opts": self.model._meta,
                "title": f"Undo Merge — {target.full_name}",
            },
        )

    list_display = [
        "name",
        "id",
        "email",
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
        name_parts = list(filter(None, [obj.first_name, obj.middle_name, obj.last_name]))

        if obj.nickname:
            name_parts.append(f"({obj.nickname})")

        return " ".join(name_parts).strip()

    search_fields = (
        "nickname",
        "email",
        "first_name",
        "last_name",
        "middle_name",
    )


@admin.register(ClientContact)
class ClientContactAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "relationship",
        "name",
        "email",
        "phone_number",
        "mailing_address",
        "client_name",
        "client_profile__id",
    )
    search_fields = (
        "name",
        "email",
        "phone_number",
        "mailing_address",
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__email",
        "client_profile__nickname",
    )

    def client_name(self, obj: ClientContact) -> str:
        return obj.client_profile.full_name

    def relationship(self, obj: ClientContact) -> str | None:
        return (
            obj.get_relationship_to_client_display()
            if obj.relationship_to_client != RelationshipTypeEnum.OTHER
            else obj.relationship_to_client_other
        )


@admin.register(ClientHouseholdMember)
class ClientHouseholdMemberAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "relationship",
        "name",
        "date_of_birth",
        "gender_display",
        "client_name",
        "client_profile__id",
    )
    search_fields = (
        "name",
        "date_of_birth",
        "gender",
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__email",
        "client_profile__nickname",
    )
    list_filter = (
        "gender",
        "relationship_to_client",
    )

    @admin.display(description="Client")
    def client_name(self, obj: ClientHouseholdMember) -> str:
        return obj.client_profile.full_name

    def date_of_birth(self, obj: ClientHouseholdMember) -> Optional[str]:
        return obj.date_of_birth.isoformat() if obj.date_of_birth else None

    def relationship(self, obj: ClientHouseholdMember) -> str | None:
        return (
            obj.get_relationship_to_client_display()
            if obj.relationship_to_client != RelationshipTypeEnum.OTHER
            else obj.relationship_to_client_other
        )

    @admin.display(description="Gender")
    def gender_display(self, obj: ClientHouseholdMember) -> str | None:
        return obj.get_gender_display() if obj.gender != GenderEnum.OTHER else obj.gender_other


@admin.register(HmisProfile)
class HmisProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "client_profile__id",
        "client_name",
        "hmis_id",
        "agency",
    )
    search_fields = (
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__email",
        "client_profile__nickname",
    )
    list_filter = ("agency",)

    @admin.display(description="Client")
    def client_name(self, obj: HmisProfile) -> str:
        return obj.client_profile.full_name


@admin.register(SocialMediaProfile)
class SocialMediaProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "client_profile__id",
        "client_name",
        "platform",
        "platform_user_id",
    )
    search_fields = (
        "client_profile__first_name",
        "client_profile__last_name",
        "client_profile__email",
        "client_profile__nickname",
        "platform_user_id",
    )
    list_filter = ("platform",)

    @admin.display(description="Client")
    def client_name(self, obj: SocialMediaProfile) -> str:
        return obj.client_profile.full_name


class ClientDocumentResource(resources.ModelResource):
    parent_id = fields.Field(column_name="Parent ID")
    created_at = fields.Field(column_name="Created On")
    updated_at = fields.Field(column_name="Updated On")
    namespace = fields.Field(column_name="Type")
    file_name = fields.Field(column_name="File Name")

    def dehydrate_parent_id(self, obj: Attachment) -> int:
        return obj.object_id

    def dehydrate_created_at(self, obj: Attachment) -> str:
        return obj.created_at.date().isoformat()

    def dehydrate_updated_at(self, obj: Attachment) -> str:
        return obj.updated_at.date().isoformat()

    def dehydrate_namespace(self, obj: Attachment) -> str | None:
        return force_str(ClientDocumentNamespaceEnum(obj.namespace).label if obj.namespace else None)

    def dehydrate_file_name(self, obj: Attachment) -> str | None:
        return obj.original_filename


@admin.register(ClientDocument)
class ClientDocumentAdmin(ExportActionMixin, admin.ModelAdmin):
    resource_class = ClientDocumentResource

    def get_export_formats(self) -> list:
        return [CSV]

    def get_queryset(self, request: HttpRequest) -> QuerySet[ClientDocument]:
        return super().get_queryset(request).filter(content_type__model="clientprofile")

    def get_search_results(self, request: HttpRequest, queryset: QuerySet, search_term: str) -> tuple[QuerySet, bool]:
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)

        if search_term:
            client_content_type = ContentType.objects.get_for_model(ClientProfile)
            matching_client_ids = ClientProfile.objects.filter(
                Q(first_name__icontains=search_term) | Q(last_name__icontains=search_term)
            ).values_list("pk", flat=True)

            queryset |= self.model.objects.filter(
                content_type=client_content_type,
                object_id__in=matching_client_ids,
            )

        return queryset, use_distinct

    list_display = (
        "attachment_type",
        "content_object",
        "created_at",
        "updated_at",
        "uploaded_by",
    )
    list_filter = (("created_at", DateRangeFilterBuilder()),)
    search_fields = (
        "id",
        "attachment_type",
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
