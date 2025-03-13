from typing import Optional, Type, cast

from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User as DefaultUser
from django.urls import reverse
from django.utils.html import format_html
from organizations.models import Organization, OrganizationInvitation, OrganizationUser

from .admin_request_mixin import AdminRequestMixin
from .forms import OrganizationUserForm, UserChangeForm, UserCreationForm
from .models import (
    ExtendedOrganizationInvitation,
    PermissionGroup,
    PermissionGroupTemplate,
    User,
)

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


@admin.register(Organization)
class CustomOrganizationAdmin(admin.ModelAdmin):
    inlines = [PermissionGroupInline]
    list_display = ("name",)  # Adjust according to your model fields
    search_fields = ("name",)  # Enables searching by name in the autocomplete fields


@admin.register(OrganizationUser)
class CustomOrganizationUserAdmin(AdminRequestMixin, ModelAdmin[User]):
    form = OrganizationUserForm


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
    list_display = ["id", "full_name", "email", "is_client", "client_id"]
    list_filter = ["organizations_organization", "is_active", "is_staff", "is_superuser"]

    def is_client(self, obj: User) -> bool:
        return hasattr(obj, "client_profile")

    def client_id(self, obj: User) -> Optional[str]:
        return (
            format_html(
                f'<a href="{reverse("admin:clients_clientprofile_change", args=(obj.client_profile.id,))}">{obj.client_profile.id}</a>'
            )
            if hasattr(obj, "client_profile")
            else None
        )
