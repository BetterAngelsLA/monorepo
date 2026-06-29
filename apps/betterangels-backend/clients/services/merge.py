"""
Client merge service.

Provides preview_merge, execute_merge, and undo_merge for merging duplicate
ClientProfile records. All mutations run inside transaction.atomic().
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from accounts.models import User
from clients.models import ClientProfile
from common.models import Attachment, PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction
from django.db.models import Q, QuerySet
from django.db.models.fields.reverse_related import ManyToOneRel
from django.utils import timezone
from deepdiff import DeepDiff

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class FieldChange:
    """A single scalar field change across the merge."""

    field_name: str
    source_values: list[Any]  # one per source profile
    target_value: Any
    resolution: str  # "target_wins" | "filled_from_source" | "conflict"


@dataclass
class RelatedChange:
    """Summary of how many related objects will move per relation."""

    relation_name: str  # e.g. "notes", "contacts"
    model_label: str  # e.g. "notes.Note"
    field_name: str  # FK field name on the related model, e.g. "client_profile"
    will_move: int
    per_source: dict[int, list[int]] = field(default_factory=dict)  # source_id → [object_ids]


@dataclass
class MergePreview:
    """Full preview of what a merge would do, without mutating anything."""

    target_id: int
    source_ids: list[int]
    target_name: str
    source_names: list[str]
    field_changes: list[FieldChange]
    related_changes: list[RelatedChange]
    conflicts: list[str]
    generated_at: datetime = field(default_factory=timezone.now)


# ---------------------------------------------------------------------------
# Relationship discovery
# ---------------------------------------------------------------------------

# Fields that should never be merged (internal / auto-managed).
_EXCLUDED_SCALAR_FIELDS: frozenset[str] = frozenset(
    {
        "id",
        "created_at",
        "updated_at",
        "merged_into",
        "merged_at",
        "merged_data",
        "profile_photo",  # ImageField — handled separately
        # pghistory-managed:
        "pgh_obj",
        "pgh_created_at",
        "pgh_label",
        "pgh_context",
    }
)

# Scalar fields whose uniqueness means a conflict if both target and source
# have different non-null values. Dynamically discovered from model Meta.
_UNIQUE_FIELDS: frozenset[str] = frozenset()  # populated below


def _discover_unique_fields() -> frozenset[str]:
    """Return the names of all unique concrete fields on ClientProfile."""
    return frozenset(
        f.name
        for f in ClientProfile._meta.get_fields()
        if getattr(f, "unique", False) and f.concrete
    )


_UNIQUE_FIELDS = _discover_unique_fields()

# GFK models that can point to ClientProfile.
# New GFK models must be added here.
_GFK_MODELS: tuple[type[models.Model], ...] = (Attachment, PhoneNumber)


class MergeValidationError(ValueError):
    """Raised when the merge request is invalid."""


def _get_scalar_fields(model: type[models.Model]) -> list[models.Field]:
    """Return concrete, non-relational, non-excluded fields on *model*."""
    fields: list[models.Field] = []
    for f in model._meta.get_fields():
        if f.name in _EXCLUDED_SCALAR_FIELDS:
            continue
        if f.is_relation or f.auto_created or f.many_to_many or f.one_to_many or f.one_to_one:
            continue
        if not f.concrete:
            continue
        fields.append(f)
    return fields


def _get_fk_relations() -> list[dict[str, Any]]:
    """Discover all ForeignKey relationships pointing TO ClientProfile."""
    relations: list[dict[str, Any]] = []
    for rel in ClientProfile._meta.related_objects:
        if not isinstance(rel, ManyToOneRel):
            continue
        fk_field = rel.field
        relations.append(
            {
                "model": rel.related_model,
                "model_label": f"{rel.related_model._meta.app_label}.{rel.related_model._meta.model_name}",
                "field_name": fk_field.name,
                "related_name": rel.related_name or rel.related_model._meta.model_name,
                "on_delete": fk_field.remote_field.on_delete,
            }
        )
    return relations


def _get_gfk_relations() -> list[dict[str, Any]]:
    """Return known GFK models that may point to ClientProfile."""
    gfk_relations: list[dict[str, Any]] = []
    for gfk_model in _GFK_MODELS:
        gfk_relations.append(
            {
                "model": gfk_model,
                "model_label": f"{gfk_model._meta.app_label}.{gfk_model._meta.model_name}",
                "content_type_field": "content_type",
                "object_id_field": "object_id",
            }
        )
    # Guardian per-object permissions use GFK with object_pk (char field, not int).
    # They are handled separately in _merge_gfk_permissions.
    return gfk_relations


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def _validate_merge_request(source_ids: list[int], target_id: int) -> tuple[ClientProfile, list[ClientProfile]]:
    """Load and validate profiles for a merge. Returns (target, sources)."""
    if not source_ids:
        raise MergeValidationError("At least one source profile is required.")

    if target_id in source_ids:
        raise MergeValidationError("Target profile cannot also be a source.")

    profiles = list(
        ClientProfile.objects.select_for_update()
        .filter(pk__in=[target_id, *source_ids])
        .order_by("pk")
    )

    target = next((p for p in profiles if p.pk == target_id), None)
    if target is None:
        raise MergeValidationError(f"Target profile {target_id} not found.")

    if target.merged_into_id is not None:
        raise MergeValidationError(
            f"Target profile '{target.full_name}' (#{target_id}) has already been "
            f"merged into another profile."
        )

    sources: list[ClientProfile] = []
    for sid in source_ids:
        source = next((p for p in profiles if p.pk == sid), None)
        if source is None:
            raise MergeValidationError(f"Source profile {sid} not found.")
        if source.merged_into_id is not None:
            raise MergeValidationError(
                f"Source profile '{source.full_name}' (#{sid}) has already been merged."
            )
        sources.append(source)

    return target, sources


# ---------------------------------------------------------------------------
# Preview
# ---------------------------------------------------------------------------


def preview_merge(
    source_ids: list[int],
    target_id: int,
) -> MergePreview:
    """
    Generate a dry-run preview of what would happen during a merge.

    No database mutations occur.
    """
    target, sources = _validate_merge_request(source_ids, target_id)

    # ---- scalar field diff via DeepDiff ----
    target_dict = {f.name: getattr(target, f.name) for f in _get_scalar_fields(ClientProfile)}
    field_changes: list[FieldChange] = []
    conflicts: list[str] = []
    source_names: list[str] = []

    for source in sources:
        source_names.append(source.full_name or f"#{source.pk}")
        source_dict = {f.name: getattr(source, f.name) for f in _get_scalar_fields(ClientProfile)}

        diff = DeepDiff(target_dict, source_dict, ignore_order=True, verbose_level=2)
        # We care about values_changed and dictionary_item_added
        for field_name in list(diff.get("values_changed", {})) + list(diff.get("dictionary_item_added", {})):
            # Skip if field isn't a real scalar field
            if field_name not in target_dict:
                continue

        # We build the FieldChange per field across ALL sources
        # So we'll do a separate pass after collecting all source values.

    # ---- collect per-field values across all sources ----
    all_scalar_fields = _get_scalar_fields(ClientProfile)
    for f in all_scalar_fields:
        source_vals: list[Any] = [getattr(s, f.name) for s in sources]
        target_val = getattr(target, f.name)

        # Determine resolution
        if target_val is not None:
            # Check for conflict on unique fields
            for sv in source_vals:
                if sv is not None and sv != target_val and f.name in _UNIQUE_FIELDS:
                    conflicts.append(
                        f"{f.name}: target has '{target_val}', "
                        f"source has '{sv}' — target's value will be kept"
                    )
            resolution = "target_wins"
        elif any(v is not None for v in source_vals):
            resolution = "filled_from_source"
        else:
            resolution = "target_wins"  # both null, no change

        field_changes.append(
            FieldChange(
                field_name=f.name,
                source_values=source_vals,
                target_value=target_val,
                resolution=resolution,
            )
        )

    # ---- related object counts ----
    related_changes: list[RelatedChange] = []

    # FK relations
    for rel_info in _get_fk_relations():
        rel_model = rel_info["model"]
        field_name = rel_info["field_name"]
        per_source: dict[int, list[int]] = {}
        total = 0
        for source in sources:
            ids = list(
                rel_model.objects.filter(**{field_name: source.pk}).values_list("pk", flat=True)
            )
            per_source[source.pk] = ids
            total += len(ids)

        related_changes.append(
            RelatedChange(
                relation_name=rel_info["related_name"],
                model_label=rel_info["model_label"],
                field_name=field_name,
                will_move=total,
                per_source=per_source,
            )
        )

    # GFK relations
    content_type = ContentType.objects.get_for_model(ClientProfile)
    for gfk_info in _get_gfk_relations():
        gfk_model = gfk_info["model"]
        per_source: dict[int, list[int]] = {}
        total = 0
        for source in sources:
            ids = list(
                gfk_model.objects.filter(
                    content_type=content_type,
                    object_id=source.pk,
                ).values_list("pk", flat=True)
            )
            per_source[source.pk] = ids
            total += len(ids)

        related_changes.append(
            RelatedChange(
                relation_name=gfk_model._meta.verbose_name_plural.replace(" ", "_"),
                model_label=gfk_info["model_label"],
                field_name="object_id",
                will_move=total,
                per_source=per_source,
            )
        )

    # Guardian permissions
    _append_guardian_permission_changes(sources, content_type, related_changes)

    # Sort: non-empty changes first
    related_changes.sort(key=lambda rc: rc.will_move, reverse=True)

    return MergePreview(
        target_id=target.pk,
        source_ids=[s.pk for s in sources],
        target_name=target.full_name or f"#{target.pk}",
        source_names=source_names,
        field_changes=field_changes,
        related_changes=related_changes,
        conflicts=conflicts,
    )


# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------


def execute_merge(
    source_ids: list[int],
    target_id: int,
    *,
    performed_by: User,
) -> ClientProfile:
    """
    Execute a merge inside transaction.atomic().

    Returns the target ClientProfile.
    """
    with transaction.atomic():
        target, sources = _validate_merge_request(source_ids, target_id)

        # ---- snapshot source scalar fields (for undo) ----
        source_snapshots: dict[int, dict[str, Any]] = {}
        scalar_fields = _get_scalar_fields(ClientProfile)
        for source in sources:
            snap: dict[str, Any] = {}
            for f in scalar_fields:
                val = getattr(source, f.name)
                # Convert file fields to their name string for JSON serialization
                if f.name == "profile_photo":
                    val = source.profile_photo.name if source.profile_photo else None
                snap[f.name] = val
            source_snapshots[source.pk] = snap

        # ---- merge scalar fields (excluding profile_photo — handled below) ----
        for f in scalar_fields:
            if f.name == "profile_photo":
                continue  # handled separately
            if getattr(target, f.name) is not None:
                continue  # target wins
            for source in sources:
                sv = getattr(source, f.name)
                if sv is not None:
                    setattr(target, f.name, sv)
                    break  # first non-null wins

        # ---- handle profile_photo ----
        if not target.profile_photo:
            for source in sources:
                if source.profile_photo:
                    # Copy the file to target (new storage path, source file untouched)
                    target.profile_photo.save(
                        source.profile_photo.name.split("/")[-1],
                        source.profile_photo.file,
                        save=False,
                    )
                    break

        # ---- clear unique fields on sources BEFORE full_clean ----
        # (otherwise source still holds email/california_id that target now has)
        unique_field_names = _UNIQUE_FIELDS - {"id", "created_at", "updated_at"}
        source_update_fields: list[str] = []
        for source in sources:
            for field_name in unique_field_names:
                if getattr(source, field_name, None) is not None:
                    setattr(source, field_name, None)
                    if field_name not in source_update_fields:
                        source_update_fields.append(field_name)
            if source_update_fields:
                source.save(update_fields=source_update_fields)

        target.full_clean()
        target.save()

        # ---- re-point FK relations ----
        fk_relations = _get_fk_relations()
        all_source_ids = [s.pk for s in sources]

        for rel_info in fk_relations:
            rel_model = rel_info["model"]
            field_name = rel_info["field_name"]

            # Capture IDs BEFORE re-pointing (for undo snapshot)
            # Already captured in the snapshot dict from preview stage.
            # Actually, we need to capture them here too for the undo data.
            moved_ids: dict[int, list[int]] = {}
            for source in sources:
                moved_ids[source.pk] = list(
                    rel_model.objects.filter(**{field_name: source.pk}).values_list("pk", flat=True)
                )

            # Handle ReservationClient dedup
            if rel_model._meta.model_name == "reservationclient":
                _dedup_reservation_clients(sources, target)

            # Bulk re-point
            rel_model.objects.filter(**{f"{field_name}__in": all_source_ids}).update(
                **{field_name: target.pk}
            )

            # Store moved IDs in source snapshots
            for source in sources:
                source_snapshots[source.pk][f"_moved_{rel_info['model_label']}"] = moved_ids.get(
                    source.pk, []
                )

        # ---- re-point GFK relations ----
        content_type = ContentType.objects.get_for_model(ClientProfile)
        for gfk_info in _get_gfk_relations():
            gfk_model = gfk_info["model"]
            moved_ids: dict[int, list[int]] = {}

            for source in sources:
                moved_ids[source.pk] = list(
                    gfk_model.objects.filter(
                        content_type=content_type, object_id=source.pk
                    ).values_list("pk", flat=True)
                )

            gfk_model.objects.filter(
                content_type=content_type, object_id__in=all_source_ids
            ).update(object_id=target.pk)

            for source in sources:
                source_snapshots[source.pk][
                    f"_moved_{gfk_info['model_label']}"
                ] = moved_ids.get(source.pk, [])

        # ---- re-point guardian permissions ----
        _merge_guardian_permissions(sources, target, content_type, source_snapshots)

        # ---- mark sources as merged ----
        now = timezone.now()
        for source in sources:
            source.merged_into = target
            source.merged_at = now
            source.merged_data = source_snapshots[source.pk]

            # Use update() to avoid triggering post_save signals / pghistory
            # (the merged_data snapshot is the audit trail)
            ClientProfile.objects.filter(pk=source.pk).update(
                merged_into=target,
                merged_at=now,
                merged_data=source_snapshots[source.pk],
            )

        return ClientProfile.objects.get(pk=target.pk)


# ---------------------------------------------------------------------------
# Undo
# ---------------------------------------------------------------------------


def undo_merge(
    target_id: int,
    *,
    performed_by: User,
) -> list[ClientProfile]:
    """
    Undo a merge: restore all sources that were merged into *target_id*.

    Returns the restored source profiles.
    """
    with transaction.atomic():
        target = (
            ClientProfile.objects.select_for_update().filter(pk=target_id).first()
        )
        if target is None:
            raise MergeValidationError(f"Target profile {target_id} not found.")

        if target.merged_into_id is not None:
            raise MergeValidationError(
                f"Target profile has itself been merged — cannot undo."
            )

        sources = list(target.merged_from.all())
        if not sources:
            raise MergeValidationError("No merged sources to undo.")

        content_type = ContentType.objects.get_for_model(ClientProfile)
        restored: list[ClientProfile] = []

        for source in sources:
            snapshot = source.merged_data or {}
            if not snapshot:
                logger.warning("Source %s has no merged_data snapshot — skipping.", source.pk)
                continue

            # ---- restore scalar fields ----
            scalar_fields = _get_scalar_fields(ClientProfile)
            for f in scalar_fields:
                if f.name in snapshot:
                    setattr(source, f.name, snapshot[f.name])

            # ---- restore FK relations ----
            fk_relations = _get_fk_relations()
            for rel_info in fk_relations:
                rel_model = rel_info["model"]
                field_name = rel_info["field_name"]
                key = f"_moved_{rel_info['model_label']}"
                moved_ids = snapshot.get(key, [])
                if moved_ids:
                    # Only re-point objects that still exist
                    existing_ids = set(
                        rel_model.objects.filter(pk__in=moved_ids).values_list("pk", flat=True)
                    )
                    if existing_ids:
                        rel_model.objects.filter(pk__in=existing_ids).update(
                            **{field_name: source.pk}
                        )

            # ---- restore GFK relations ----
            for gfk_info in _get_gfk_relations():
                gfk_model = gfk_info["model"]
                key = f"_moved_{gfk_info['model_label']}"
                moved_ids = snapshot.get(key, [])
                if moved_ids:
                    existing_ids = set(
                        gfk_model.objects.filter(pk__in=moved_ids).values_list("pk", flat=True)
                    )
                    if existing_ids:
                        gfk_model.objects.filter(pk__in=existing_ids).update(object_id=source.pk)

            # ---- restore guardian permissions ----
            _restore_guardian_permissions(source, target, content_type, snapshot)

            # ---- clear merge markers ----
            source.merged_into = None
            source.merged_at = None
            source.merged_data = None
            source.save()
            restored.append(source)

        return restored


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _dedup_reservation_clients(
    sources: list[ClientProfile],
    target: ClientProfile,
) -> None:
    """Delete source ReservationClient rows that conflict with target's reservations."""
    from shelters.models.reservation import ReservationClient

    source_ids = [s.pk for s in sources]
    # Find reservations where target already has a row
    target_reservation_ids = set(
        ReservationClient.objects.filter(client_profile=target).values_list(
            "reservation_id", flat=True
        )
    )
    if target_reservation_ids:
        ReservationClient.objects.filter(
            client_profile_id__in=source_ids,
            reservation_id__in=target_reservation_ids,
        ).delete()


def _get_guardian_perm_models() -> list[type[models.Model]]:
    """Return guardian permission models that use GFK to ClientProfile."""
    try:
        from accounts.models import BigGroupObjectPermission, BigUserObjectPermission

        return [BigUserObjectPermission, BigGroupObjectPermission]
    except ImportError:
        return []


def _append_guardian_permission_changes(
    sources: list[ClientProfile],
    content_type: ContentType,
    related_changes: list[RelatedChange],
) -> None:
    """Append guardian permission move counts to *related_changes*."""
    for perm_model in _get_guardian_perm_models():
        per_source: dict[int, list[int]] = {}
        total = 0
        for source in sources:
            ids = list(
                perm_model.objects.filter(
                    content_type=content_type, object_pk=str(source.pk)
                ).values_list("pk", flat=True)
            )
            per_source[source.pk] = ids
            total += len(ids)

        if total > 0:
            related_changes.append(
                RelatedChange(
                    relation_name=perm_model._meta.verbose_name_plural.replace(" ", "_"),
                    model_label=f"{perm_model._meta.app_label}.{perm_model._meta.model_name}",
                    field_name="object_pk",
                    will_move=total,
                    per_source=per_source,
                )
            )


def _merge_guardian_permissions(
    sources: list[ClientProfile],
    target: ClientProfile,
    content_type: ContentType,
    source_snapshots: dict[int, dict[str, Any]],
) -> None:
    """Re-point guardian permissions from sources to target."""
    for perm_model in _get_guardian_perm_models():
        for source in sources:
            moved_ids = list(
                perm_model.objects.filter(
                    content_type=content_type, object_pk=str(source.pk)
                ).values_list("pk", flat=True)
            )
            source_snapshots[source.pk][
                f"_moved_{perm_model._meta.app_label}.{perm_model._meta.model_name}"
            ] = moved_ids

        perm_model.objects.filter(
            content_type=content_type,
            object_pk__in=[str(s.pk) for s in sources],
        ).update(object_pk=str(target.pk))


def _restore_guardian_permissions(
    source: ClientProfile,
    target: ClientProfile,
    content_type: ContentType,
    snapshot: dict[str, Any],
) -> None:
    """Restore guardian permissions back to *source*."""
    for perm_model in _get_guardian_perm_models():
        key = f"_moved_{perm_model._meta.app_label}.{perm_model._meta.model_name}"
        moved_ids = snapshot.get(key, [])
        if moved_ids:
            existing_ids = set(
                perm_model.objects.filter(pk__in=moved_ids).values_list("pk", flat=True)
            )
            if existing_ids:
                perm_model.objects.filter(pk__in=existing_ids).update(
                    object_pk=str(source.pk)
                )
