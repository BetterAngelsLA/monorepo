"""
Admin mixin for ClientProfile merge functionality.

Extracted from admin.py per Hacksoft styleguide: keep views thin,
extract reusable concern groups into mixins.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import cast

from accounts.models import User
from django.contrib import admin, messages
from django.contrib.admin.sites import AdminSite
from django.db.models import QuerySet
from django.http import HttpRequest, HttpResponseRedirect
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse

from clients.models import ClientProfile
from clients.selectors.merge import get_client_by_id, get_merged_sources, get_profiles_by_ids
from clients.services.merge import MergeValidationError, merge_execute, merge_preview, merge_undo


class ClientProfileMergeMixin:
    """Merge-related admin views, actions, and queryset overrides.

    Mixed into ClientProfileAdmin so merge logic lives in a focused,
    testable module rather than bloating the main admin.py.
    """

    # Declared here so mypy knows these come from admin.ModelAdmin.
    model: type[ClientProfile]
    message_user: Callable[..., None]
    admin_site: AdminSite

    # ---- Queryset: show/hide merged profiles ----

    def get_queryset(self, request: HttpRequest) -> QuerySet[ClientProfile]:
        if request.GET.get("show_merged"):
            return self.model._base_manager.all()
        return cast(QuerySet[ClientProfile], cast(admin.ModelAdmin, self).get_queryset(request))

    # ---- Change view: show undo link when applicable ----

    def change_view(
        self, request: HttpRequest, object_id: str, form_url: str = "", extra_context: dict | None = None
    ) -> HttpResponseRedirect | TemplateResponse:
        extra_context = extra_context or {}
        extra_context["merged_sources"] = get_merged_sources(int(object_id))
        return cast(
            HttpResponseRedirect | TemplateResponse,
            cast(admin.ModelAdmin, self).change_view(request, object_id, form_url, extra_context),
        )

    # ---- URLs ----

    def get_urls(self) -> list:
        urls = cast(list, cast(admin.ModelAdmin, self).get_urls())
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

    # ---- Merge action (list-level) ----

    @admin.action(description="Merge selected clients")
    def merge_clients(self, request: HttpRequest, queryset: QuerySet[ClientProfile]) -> HttpResponseRedirect:
        if queryset.count() < 2:
            self.message_user(request, "Select at least 2 clients to merge.", messages.ERROR)
            return redirect(request.get_full_path())

        ids = ",".join(str(pk) for pk in queryset.values_list("pk", flat=True))
        return redirect(reverse("admin:clients_clientprofile_merge") + f"?ids={ids}")

    # ---- Merge wizard ----

    def merge_view(self, request: HttpRequest) -> HttpResponseRedirect | TemplateResponse:
        """Multi-step merge wizard: select target → preview → execute."""
        ids, ids_param = self._parse_merge_ids(request)
        if ids is None:
            self.message_user(request, "Invalid client IDs.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_changelist"))

        profiles = get_profiles_by_ids(ids) if ids else []
        if ids and len(profiles) != len(ids):
            self.message_user(request, "Some selected clients no longer exist.", messages.WARNING)

        # Step 0: Add client by ID
        if request.method == "POST" and "add_client_id" in request.POST:
            return self._handle_add_client(request, ids, profiles, ids_param)

        target_id = request.POST.get("target_id") or request.GET.get("target_id")

        # Step 1: Select target page
        if request.method == "GET" and not target_id:
            return self._render_select_target(request, profiles, ids_param)

        # Minimum check: 2+ profiles required for preview & confirm
        if len(profiles) < 2:
            self.message_user(request, "Add at least 2 clients to merge.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_merge") + (f"?ids={ids_param}" if ids_param else ""))

        is_preview = "preview" in request.POST
        is_confirm = "confirm" in request.POST

        # Step 2: Preview
        if request.method == "POST" and is_preview:
            return self._handle_preview(request, profiles, ids_param, target_id)

        # Step 3: Execute
        if request.method == "POST" and is_confirm:
            return self._handle_execute(request, profiles, ids_param, target_id)

        # Fallback
        return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

    # ---- Merge wizard helpers ----

    @staticmethod
    def _parse_merge_ids(request: HttpRequest) -> tuple[list[int] | None, str]:
        """Parse comma-separated ids from POST or GET. Returns (ids, param_str)."""
        ids_param = request.POST.get("ids") or request.GET.get("ids", "")
        try:
            ids = [int(i) for i in ids_param.split(",") if i]
        except ValueError:
            return None, ids_param
        return ids, ids_param

    def _handle_add_client(
        self,
        request: HttpRequest,
        ids: list[int],
        profiles: list[ClientProfile],
        ids_param: str,
    ) -> TemplateResponse:
        """Add a client by ID to the merge candidate list."""
        added_id_str = request.POST["add_client_id"].strip()
        try:
            added_id = int(added_id_str)
        except ValueError:
            self.message_user(request, f"Invalid client ID: '{added_id_str}'.", messages.ERROR)
            return self._render_select_target(request, profiles, ids_param)

        if added_id in ids:
            return self._render_select_target(request, profiles, ids_param)

        client = get_client_by_id(added_id)
        if client is None:
            self.message_user(request, f"Client #{added_id_str} not found.", messages.ERROR)
            return self._render_select_target(request, profiles, ids_param)

        ids.append(added_id)
        profiles = get_profiles_by_ids(ids)
        ids_param = ",".join(str(pk) for pk in ids)
        self.message_user(
            request,
            f"Added '{client.full_name}' (#{added_id}).",
            messages.SUCCESS,
        )
        return self._render_select_target(request, profiles, ids_param)

    def _render_select_target(
        self, request: HttpRequest, profiles: list[ClientProfile], ids_param: str
    ) -> TemplateResponse:
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

    def _handle_preview(
        self,
        request: HttpRequest,
        profiles: list[ClientProfile],
        ids_param: str,
        target_id: str | None,
    ) -> HttpResponseRedirect | TemplateResponse:
        try:
            tid = int(cast(str, target_id))
        except ValueError, TypeError:
            self.message_user(request, "Please select a target profile.", messages.ERROR)
            return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

        source_ids = [p.pk for p in profiles if p.pk != tid]
        if not source_ids:
            self.message_user(request, "Select at least one source profile (different from target).", messages.ERROR)
            return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}&target_id={tid}")

        try:
            preview = merge_preview(source_ids=source_ids, target_id=tid)
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

    def _handle_execute(
        self,
        request: HttpRequest,
        profiles: list[ClientProfile],
        ids_param: str,
        target_id: str | None,
    ) -> HttpResponseRedirect | TemplateResponse:
        try:
            tid = int(cast(str, target_id))
        except ValueError, TypeError:
            self.message_user(request, "Invalid target ID.", messages.ERROR)
            return redirect(f"{reverse('admin:clients_clientprofile_merge')}?ids={ids_param}")

        source_ids = [p.pk for p in profiles if p.pk != tid]
        try:
            merged = merge_execute(
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

    # ---- Undo merge ----

    def undo_merge_view(self, request: HttpRequest, pk: int) -> HttpResponseRedirect | TemplateResponse:
        target = get_client_by_id(pk)
        if target is None:
            self.message_user(request, "Client not found.", messages.ERROR)
            return redirect(reverse("admin:clients_clientprofile_changelist"))

        sources = get_merged_sources(pk)
        if not sources:
            self.message_user(request, "No merged sources to undo.", messages.WARNING)
            return redirect(reverse("admin:clients_clientprofile_change", args=[pk]))

        if request.method == "POST" and "confirm_undo" in request.POST:
            try:
                restored = merge_undo(target_id=pk, performed_by=cast(User, request.user))
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
