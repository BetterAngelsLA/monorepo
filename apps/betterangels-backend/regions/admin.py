from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Region

#: Every field on ``Region``. Boundaries are data, not content: they are produced by
#: ``manage.py import_regions`` and replaced wholesale per dimension, so **every** field is
#: read-only here rather than hand-editable. Listed exhaustively (including the
#: ``BaseModel`` timestamps) instead of naming the interesting ones, because the failure
#: mode of an omission is silent: an editable ``source_attribution`` or ``geom_display``
#: lets someone change what the map draws, or the provenance the importer recorded, with
#: no import and no audit trail — and ``geom_display`` is exactly what the Reports map
#: renders.
READONLY_FIELDS: tuple[str, ...] = (
    "kind",
    "code",
    "name",
    "source_url",
    "source_vintage",
    "source_attribution",
    "source_item_id",
    "geom",
    "geom_display",
    "created_at",
    "updated_at",
)


@admin.register(Region)
class RegionAdmin(GISModelAdmin):
    """Boundary layers are data, not content: view and re-import only."""

    list_display = ("kind", "code", "name", "source_vintage", "source_item_id")
    list_filter = ("kind",)
    search_fields = ("code", "name")
    readonly_fields = READONLY_FIELDS
    # The change form is a viewer. Without this, Django still offers the Save buttons and
    # the "you don't have permission to edit anything" state depends on the field list
    # being exactly right.
    actions = None

    def has_add_permission(self, request: object) -> bool:
        # Boundaries arrive via `manage.py import_regions`, never by hand.
        return False

    def has_change_permission(self, request: object, obj: object = None) -> bool:
        # Kept True so the list and detail views render — the fields above are read-only,
        # so this grants "can look at the boundary set", not "can alter it".
        return True

    def has_delete_permission(self, request: object, obj: object = None) -> bool:
        # A delete would cascade to every ``RegionPiece`` for the dimension, leaving the
        # lookup to fall back to the parent boundary for all of them — correct, but slower
        # until the next import. Replacing a dimension is the importer's job, which does it
        # in one transaction and rebuilds the pieces with it.
        return False

    def get_readonly_fields(self, request: object, obj: object = None) -> tuple[str, ...]:
        return READONLY_FIELDS
