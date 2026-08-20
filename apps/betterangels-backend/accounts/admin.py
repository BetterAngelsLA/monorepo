from typing import Any, Type, cast

from common.org_types import REGISTRY
from django.contrib import admin, messages
from django.contrib.admin import ModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User as DefaultUser
from django.contrib.sites.models import Site
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.http import HttpRequest, HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import URLPattern, path, reverse
from organizations.backends import invitation_backend
from organizations.models import Organization, OrganizationInvitation, OrganizationUser

from .forms import (
    OrganizationMemberInviteForm,
    OrganizationProfileForm,
    UserChangeForm,
    UserCreationForm,
)
from .models import (
    ExtendedOrganizationInvitation,
    OrganizationProfile,
    PermissionGroup,
    PermissionGroupTemplate,
    User,
)
from .services import member_add, reconcile_org_groups

admin.site.unregister(Organization)
admin.site.unregister(OrganizationUser)
admin.site.unregister(OrganizationInvitation)


@admin.register(PermissionGroup)
class PermissionGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "group", "template")
    list_filter = ("organization", "template")


@admin.register(PermissionGroupTemplate)
class PermissionGroupTemplateAdmin(admin.ModelAdmin):
    list_display = [
        "name",
    ]
    search_fields = [
        "name",
    ]


class PermissionGroupInline(admin.TabularInline):
    model = PermissionGroup
    extra = 1


class OrganizationProfileInline(admin.StackedInline):
    model = OrganizationProfile
    form = OrganizationProfileForm
    can_delete = False
    min_num = 1
    max_num = 1
    verbose_name_plural = "Profile"


@admin.register(Organization)
class CustomOrganizationAdmin(admin.ModelAdmin):
    inlines = [OrganizationProfileInline, PermissionGroupInline]
    list_display = ("name",)
    search_fields = ("name",)
    fields = ("name", "is_active", "slug")
    readonly_fields = ("slug",)
    change_form_template = "admin/organizations/organization/change_form.html"

    def save_related(self, request: HttpRequest, form: Any, formsets: Any, change: bool) -> None:
        """Reconcile permission groups once the profile's org types are saved."""
        super().save_related(request, form, formsets, change)
        reconcile_org_groups(form.instance)

    def get_urls(self) -> list[URLPattern]:
        custom_urls = [
            path(
                "<path:object_id>/add-member/",
                self.admin_site.admin_view(self.add_member_view),
                name="organizations_organization_add_member",
            ),
        ]
        return custom_urls + super().get_urls()

    def add_member_view(self, request: HttpRequest, object_id: str) -> HttpResponse:
        """Invite a person into this organization with a single role."""
        organization = get_object_or_404(Organization, pk=object_id)
        changelist_url = reverse("admin:organizations_organization_changelist")

        if request.method == "POST":
            form = OrganizationMemberInviteForm(request.POST, organization=organization)
            if form.is_valid():
                return self._invite_member(request, organization, form, changelist_url)
        else:
            form = OrganizationMemberInviteForm(organization=organization)

        context = {
            **self.admin_site.each_context(request),
            "opts": self.model._meta,
            "organization": organization,
            "form": form,
            "title": f"Add member to {organization.name}",
        }
        return TemplateResponse(request, "admin/organizations/organization/add_member.html", context)

    def _invite_member(
        self,
        request: HttpRequest,
        organization: Organization,
        form: OrganizationMemberInviteForm,
        changelist_url: str,
    ) -> HttpResponseRedirect:
        email = form.cleaned_data["email"]
        role_template = REGISTRY.get_template_or_raise(form.cleaned_data["permission_template"], organization)

        try:
            user = member_add(
                email=email,
                first_name="",
                last_name="",
                middle_name=None,
                organization=organization,
                permission_templates=(role_template,),
            )
        except ValidationError as error:
            self.message_user(request, "; ".join(error.messages), messages.ERROR)
            return redirect(request.get_full_path())

        sender = request.user
        site = Site.objects.get(pk=settings.SITE_ID)

        def send_invitation() -> None:
            invitation_backend().create_organization_invite(
                organization=organization,
                invited_by_user=sender,
                invitee_user=user,
            )
            invitation_backend().send_invitation(
                user=user,
                sender=sender,
                organization=organization,
                domain=site,
                role_template=role_template,
            )

        transaction.on_commit(send_invitation)

        self.message_user(
            request,
            f"Invited {email} to {organization.name} as {role_template.name}.",
            messages.SUCCESS,
        )
        return redirect(changelist_url)


@admin.register(OrganizationUser)
class CustomOrganizationUserAdmin(ModelAdmin[OrganizationUser]):
    list_display = ("user", "organization")
    list_filter = ("organization",)

    def has_add_permission(self, request: HttpRequest) -> bool:
        """Members are added from the organization's "Add member" page."""
        return False


@admin.register(ExtendedOrganizationInvitation)
class ExtendedOrganizationInvitationAdmin(ModelAdmin[ExtendedOrganizationInvitation]):
    list_display = ("invited_by", "invitee", "organization", "accepted")
    search_fields = ("invited_by__username", "invitee__username", "organization__name")
    list_filter = ("organization", "accepted")


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (("Personal info"), {"fields": ("first_name", "last_name", "middle_name")}),
        (
            ("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (("Important dates"), {"fields": ("last_login",)}),
    )
    # Not convinced this is the right type; we cast our custom User as a DefaultUser.
    model = cast(Type[DefaultUser], User)
    list_display = ["id", "full_name", "email"]
    list_filter = ["organizations_organization", "is_active", "is_staff", "is_superuser"]
