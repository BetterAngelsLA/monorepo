from django.contrib import admin
from django.http import HttpRequest

from .models import Team


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "created_at", "updated_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")
    ordering = ("organization", "name")

    def get_readonly_fields(self, request: HttpRequest, obj: Team | None = None) -> tuple[str, ...]:
        """Fix a team's organization once the row exists.

        Notes and tasks reference ``(team_id, organization_id)`` as a composite
        foreign key, so repointing a team strands every record holding it with no
        matching parent -- an IntegrityError at commit rather than anything this
        page could explain. Nothing else in the product moves a team between
        organizations.
        """
        if obj is None:
            return tuple(self.readonly_fields)

        return ("organization", *self.readonly_fields)
