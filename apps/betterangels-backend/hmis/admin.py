from django.contrib import admin
from hmis.models import HmisClientProfile, HmisNote


@admin.register(HmisClientProfile)
class HmisClientProfileAdmin(admin.ModelAdmin):
    list_display = ("hmis_id", "first_name", "last_name", "email")
    search_fields = ("hmis_id", "email", "last_name")


@admin.register(HmisNote)
class HmisNoteAdmin(admin.ModelAdmin):
    list_display = ("hmis_id", "title", "date", "hmis_client_profile")
    search_fields = ("hmis_id", "title")
