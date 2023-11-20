from typing import Type, cast

from django.conf import settings
from django.contrib import admin
from django.contrib.admin import ModelAdmin
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User as DefaultUser
from organizations.models import OrganizationUser
from simple_history.admin import SimpleHistoryAdmin
from simple_history.models import HistoricalRecords

from .admin_request_mixin import AdminRequestMixin
from .forms import OrganizationUserForm, UserChangeForm, UserCreationForm
from .models import User


class CustomOrganizationUserAdmin(AdminRequestMixin, ModelAdmin[User]):
    form = OrganizationUserForm


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
    # Not convinced this is the right type
    model = cast(Type[DefaultUser], User)
    list_display = [
        "email",
    ]

    history = HistoricalRecords()


admin.site.register(User, UserAdmin)
admin.site.unregister(OrganizationUser)
admin.site.register(OrganizationUser, CustomOrganizationUserAdmin)

admin.site.login = staff_member_required(  # type: ignore
    admin.site.login, login_url=settings.LOGIN_URL
)
