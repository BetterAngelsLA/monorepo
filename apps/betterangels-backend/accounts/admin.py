from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import BetterAngelsUserChangeForm, BetterAngelsUserCreationForm
from .models import BetterAngelsUser


class BetterAngelsUserAdmin(UserAdmin):
    add_form = BetterAngelsUserCreationForm
    form = BetterAngelsUserChangeForm
    model = BetterAngelsUser
    list_display = [
        "email",
    ]


admin.site.register(BetterAngelsUser, BetterAngelsUserAdmin)
