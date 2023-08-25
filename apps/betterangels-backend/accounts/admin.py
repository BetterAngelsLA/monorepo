from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import BAUserChangeForm, BAUserCreationForm
from .models import BAUser


class BAUserAdmin(UserAdmin):
    add_form = BAUserCreationForm
    form = BAUserChangeForm
    model = BAUser
    list_display = [
        "email",
    ]


admin.site.register(BAUser, BAUserAdmin)
