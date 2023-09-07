from . import app_settings as app_settings
from .adapter import get_adapter as get_adapter
from .models import EmailAddress as EmailAddress, EmailConfirmation as EmailConfirmation
from _typeshed import Incomplete
from django.contrib import admin

class EmailAddressAdmin(admin.ModelAdmin):
    list_display: Incomplete
    list_filter: Incomplete
    search_fields: Incomplete
    raw_id_fields: Incomplete
    actions: Incomplete
    def get_search_fields(self, request): ...
    def make_verified(self, request, queryset) -> None: ...

class EmailConfirmationAdmin(admin.ModelAdmin):
    list_display: Incomplete
    list_filter: Incomplete
    raw_id_fields: Incomplete
