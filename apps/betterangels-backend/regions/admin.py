from typing import Any

from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin
from django.http import HttpRequest

from .models import Region

#: Every field on ``Region``. Boundaries are data, not content: they are produced by
#: ``manage.py import_regions`` and replaced wholesale per dimension, so **every** field is
#: read-only here rather than hand-editable. Listed exhaustively (including the
#: ``BaseModel`` timestamps) instead of naming the interesting ones, because the failure
#: mode of an omission is silent: an editable ``geom`` lets someone redraw a boundary — and
#: ``geom_display``, the column the boundary tiles actually read, is derived from it — while
#: an editable ``source_attribution`` rewrites the provenance the importer recorded. Either
#: would take effect with no import and no audit trail. ``geom_display`` is generated and so
#: not writable through the ORM at all; it is listed to make the tile path explicit.
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
    # Nothing to run: the model has no write path here at all (see the permissions below).
    actions = None

    def has_add_permission(self, request: HttpRequest) -> bool:
        # Boundaries arrive via `manage.py import_regions`, never by hand.
        return False

    def has_change_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        """False, and that is what makes the page a viewer rather than a form.

        Listing every field as read-only is not enough on its own: the form still *validates*,
        so a POST calls ``save_model`` — bumping ``updated_at`` and writing a ``LogEntry`` with
        no change behind it — and the submit row still renders Save, because its ``can_save`` is
        exactly ``has_change_permission and change``. Returning False turns the title into
        "View", drops the button row, and makes a hand-made POST a 403.
        """
        return False

    def has_view_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        # True for staff, rather than delegating to the `regions.*` codenames: the catalog
        # excludes those (`common.permissions.utils.PERMISSION_EXCLUDED_MODELS`), so no role
        # carries `view_region` and the default check would hide the boundaries from everyone
        # but a superuser. The rows are public reference data.
        return True

    def has_module_permission(self, request: HttpRequest) -> bool:
        """Show the app to any active staff user.

        Same reason as ``has_view_permission``: the default needs a ``regions.*`` codename to
        put the app on the index page, and nothing carries one. Being able to *look* at what is
        loaded is not a privilege here — the boundary tile endpoint serves the same polygons to
        any signed-in user.
        """
        return request.user.is_active and request.user.is_staff

    def has_delete_permission(self, request: HttpRequest, obj: Any = None) -> bool:
        # A delete would cascade to every ``RegionPiece`` for the dimension, leaving the
        # lookup to fall back to the parent boundary for all of them — correct, but slower
        # until the next import. Replacing a dimension is the importer's job, which does it
        # in one transaction and rebuilds the pieces with it.
        return False
