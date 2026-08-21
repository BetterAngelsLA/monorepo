from django.contrib import admin

from .models import Team


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "created_at", "updated_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")
    ordering = ("organization", "name")
