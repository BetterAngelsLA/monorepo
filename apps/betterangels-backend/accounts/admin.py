from django.conf import settings
from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from organizations.models import OrganizationInvitation, OrganizationUser
from simple_history.admin import SimpleHistoryAdmin
from simple_history.models import HistoricalRecords

from .admin_request_mixin import AdminRequestMixin
from .forms import OrganizationUserForm, UserChangeForm, UserCreationForm
from .models import ExtendedOrganizationInvitation, User


class CustomOrganizationUserAdmin(AdminRequestMixin, ModelAdmin[User]):
    form = OrganizationUserForm


class ExtendedOrganizationInvitationAdmin(ModelAdmin[ExtendedOrganizationInvitation]):
    list_display = ("invited_by", "invitee", "organization", "accepted")
    search_fields = ("invited_by__username", "invitee__username", "organization__name")
    list_filter = ("organization",)


class UserAdmin(SimpleHistoryAdmin, BaseUserAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (("Personal info"), {"fields": ("first_name", "last_name")}),
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
    model = get_user_model()
    list_display = [
        "email",
    ]

    history = HistoricalRecords()


admin.site.register(User, UserAdmin)
admin.site.unregister(OrganizationUser)
admin.site.unregister(OrganizationInvitation)
admin.site.register(OrganizationUser, CustomOrganizationUserAdmin)
admin.site.register(ExtendedOrganizationInvitation, ExtendedOrganizationInvitationAdmin)

admin.site.login = staff_member_required(  # type: ignore
    admin.site.login, login_url=settings.LOGIN_URL
)
