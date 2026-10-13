from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Region


@admin.register(Region)
class RegionAdmin(GISModelAdmin):
    """Boundary layers are data, not content: view and re-import only."""

    list_display = ("kind", "code", "name", "source_vintage")
    list_filter = ("kind",)
    search_fields = ("code", "name")
    readonly_fields = ("kind", "code", "name", "source_url", "source_vintage", "geom")

    def has_add_permission(self, request: object) -> bool:
        # Boundaries arrive via `manage.py import_regions`, never by hand.
        return False
