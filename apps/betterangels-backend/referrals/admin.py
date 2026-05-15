from django.contrib import admin

from .models import Referral


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("client_profile", "shelter", "status", "created_by", "created_at")
    list_filter = ("status",)
    search_fields = ("client_profile__first_name", "client_profile__last_name", "shelter__name")
    ordering = ("-created_at",)
