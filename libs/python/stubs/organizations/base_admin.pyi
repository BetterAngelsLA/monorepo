from _typeshed import Incomplete
from django.contrib import admin

class BaseOwnerInline(admin.StackedInline):
    raw_id_fields: Incomplete

class BaseOrganizationAdmin(admin.ModelAdmin):
    list_display: Incomplete
    prepopulated_fields: Incomplete
    search_fields: Incomplete
    list_filter: Incomplete

class BaseOrganizationUserAdmin(admin.ModelAdmin):
    list_display: Incomplete
    raw_id_fields: Incomplete

class BaseOrganizationOwnerAdmin(admin.ModelAdmin):
    raw_id_fields: Incomplete
