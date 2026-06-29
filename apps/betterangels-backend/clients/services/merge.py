"""
Client merge service.

Services handle business logic + database writes.
Selectors (clients/selectors/merge.py) handle database reads per Hacksoft pattern.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from accounts.models import User
from clients.models import ClientProfile
from clients.selectors.merge import (
    MergeProfilesNotFoundError,
    get_fk_relations,
    get_gfk_relations,
    get_merge_profiles,
    get_related_object_ids,
    get_scalar_fields,
    get_unique_fields,
)
from django.contrib.contenttypes.models import ContentType
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models, transaction
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Dataclasses
# ---------------------------------------------------------------------------


@dataclass
class FieldChange:
    """A single scalar field change across the merge."""

    field_name: str
    source_values: list[Any]
    target_value: Any
    resolution: str  # "target_wins" | "filled_from_source" | "conflict"


@dataclass
class RelatedChange:
    """Summary of how many related objects will move per relation."""

    relation_name: str
    model_label: str
    field_name: str
    will_move: int
    per_source: dict[int, list[int]] = field(default_factory=dict)


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
# Errors
# ---------------------------------------------------------------------------


class MergeValidationError(ValueError):
    """Raised when merge business rules are violated."""


# ---------------------------------------------------------------------------
# Validation (business rules only — DB read delegated to selector)
# ---------------------------------------------------------------------------


def _validate_merge_inputs(
    source_ids: list[int],
    target_id: int,
    *,
    for_update: bool = False,
) -> tuple[ClientProfile, list[ClientProfile]]:
    """Validate business rules. DB fetch delegated to get_merge_profiles selector."""
    if not source_ids:
        raise MergeValidationError("At least one source profile is required.")

    if target_id in source_ids:
        raise MergeValidationError("Target profile cannot also be a source.")

    try:
        target, sources = get_merge_profiles(source_ids, target_id, for_update=for_update)
    except MergeProfilesNotFoundError as e:
        raise MergeValidationError(str(e)) from e

    if target.merged_into_id is not None:
        raise MergeValidationError(f"Target profile '{target.full_name}' (#{target_id}) has already been merged.")

    for source in sources:
        if source.merged_into_id is not None:
            raise MergeValidationError(f"Source profile '{source.full_name}' (#{source.pk}) has already been merged.")

    return target, sources


# ---------------------------------------------------------------------------
# Preview (reads only — no mutations)
# ---------------------------------------------------------------------------


def preview_merge(source_ids: list[int], target_id: int) -> MergePreview:
    """Dry-run: return MergePreview without mutating anything."""
    target, sources = _validate_merge_inputs(source_ids, target_id)

    unique_fields = get_unique_fields()
    scalar_fields = get_scalar_fields(ClientProfile)
    content_type = ContentType.objects.get_for_model(ClientProfile)

    # ---- Field changes ----
    field_changes: list[FieldChange] = []
    conflicts: list[str] = []

    for f in scalar_fields:
        source_vals: list[Any] = [getattr(s, f.name) for s in sources]
        target_val = getattr(target, f.name)

        if target_val is not None:
            for sv in source_vals:
                if sv is not None and sv != target_val and f.name in unique_fields:
                    conflicts.append(
                        f"{f.name}: target has '{target_val}', source has '{sv}' — target's value will be kept"
                    )
            resolution = "target_wins"
        elif any(v is not None for v in source_vals):
            resolution = "filled_from_source"
        else:
            resolution = "target_wins"

        field_changes.append(
            FieldChange(
                field_name=f.name,
                source_values=source_vals,
                target_value=target_val,
                resolution=resolution,
            )
        )

    # ---- Related object counts ----
    related_changes: list[RelatedChange] = []

    for rel_info in get_fk_relations():
        per_source = get_related_object_ids(rel_info, sources)
        related_changes.append(
            RelatedChange(
                relation_name=rel_info["related_name"],
                model_label=rel_info["model_label"],
                field_name=rel_info["field_name"],
                will_move=sum(len(ids) for ids in per_source.values()),
                per_source=per_source,
            )
        )

    for gfk_info in get_gfk_relations():
        per_source = get_related_object_ids(gfk_info, sources, content_type=content_type)
        related_changes.append(
            RelatedChange(
                relation_name=gfk_info["model"]._meta.verbose_name_plural.replace(" ", "_"),
                model_label=gfk_info["model_label"],
                field_name="object_id",
                will_move=sum(len(ids) for ids in per_source.values()),
                per_source=per_source,
            )
        )

    _append_guardian_permission_changes(sources, content_type, related_changes)
    related_changes.sort(key=lambda rc: rc.will_move, reverse=True)

    return MergePreview(
        target_id=target.pk,
        source_ids=[s.pk for s in sources],
        target_name=target.full_name or f"#{target.pk}",
        source_names=[s.full_name or f"#{s.pk}" for s in sources],
        field_changes=field_changes,
        related_changes=related_changes,
        conflicts=conflicts,
    )


# ---------------------------------------------------------------------------
# Execute (writes — atomic)
# ---------------------------------------------------------------------------


def execute_merge(
    source_ids: list[int],
    target_id: int,
    *,
    performed_by: User,  # reserved for future audit logging
) -> ClientProfile:
    """Execute a merge inside transaction.atomic(). Returns the target."""
    with transaction.atomic():
        target, sources = _validate_merge_inputs(source_ids, target_id, for_update=True)

        scalar_fields = get_scalar_fields(ClientProfile)
        unique_fields = get_unique_fields()
        content_type = ContentType.objects.get_for_model(ClientProfile)

        # ---- Snapshot source scalar fields (for undo) ----
        source_snapshots: dict[int, dict[str, Any]] = {}
        for source in sources:
            snap: dict[str, Any] = {}
            for f in scalar_fields:
                val = getattr(source, f.name)
                if f.name == "profile_photo":
                    val = source.profile_photo.name if source.profile_photo else None
                snap[f.name] = val
            # Round-trip through DjangoJSONEncoder so psycopg's stdlib
            # json.dumps won't choke on date/datetime/Decimal/PhoneNumber/etc.
            # default=str is a safety net for any type Django doesn't know.
            source_snapshots[source.pk] = json.loads(json.dumps(snap, cls=DjangoJSONEncoder, default=str))

        # ---- Merge scalar fields ----
        for f in scalar_fields:
            if f.name == "profile_photo":
                continue
            if getattr(target, f.name) is not None:
                continue
            for source in sources:
                sv = getattr(source, f.name)
                if sv is not None:
                    setattr(target, f.name, sv)
                    break

        # ---- Copy profile_photo ----
        if not target.profile_photo:
            for source in sources:
                if source.profile_photo:
                    target.profile_photo.save(
                        source.profile_photo.name.split("/")[-1],
                        source.profile_photo.file,
                        save=False,
                    )
                    break

        # ---- Clear unique fields on sources before full_clean ----
        clean_unique = unique_fields - {"id"}  # id is always unique (PK)
        for source in sources:
            updated = []
            for fn in clean_unique:
                if getattr(source, fn, None) is not None:
                    setattr(source, fn, None)
                    updated.append(fn)
            if updated:
                source.save(update_fields=updated)

        target.full_clean()
        target.save()

        # ---- Re-point FK relations ----
        all_source_ids = [s.pk for s in sources]
        for rel_info in get_fk_relations():
            rel_model = rel_info["model"]
            field_name = rel_info["field_name"]

            for source in sources:
                source_snapshots[source.pk][f"_moved_{rel_info['model_label']}"] = list(
                    rel_model.objects.filter(**{field_name: source.pk}).values_list("pk", flat=True)
                )

            if rel_model._meta.model_name == "reservationclient":
                _dedup_reservation_clients(sources, target)

            rel_model.objects.filter(**{f"{field_name}__in": all_source_ids}).update(**{field_name: target.pk})

        # ---- Re-point GFK relations ----
        for gfk_info in get_gfk_relations():
            gfk_model = gfk_info["model"]
            for source in sources:
                source_snapshots[source.pk][f"_moved_{gfk_info['model_label']}"] = list(
                    gfk_model.objects.filter(content_type=content_type, object_id=source.pk).values_list(
                        "pk", flat=True
                    )
                )

            gfk_model.objects.filter(content_type=content_type, object_id__in=all_source_ids).update(
                object_id=target.pk
            )

        # ---- Re-point guardian permissions ----
        _merge_guardian_permissions(sources, target, content_type, source_snapshots)

        # ---- Mark sources as merged ----
        now = timezone.now()
        for source in sources:
            ClientProfile.objects.filter(pk=source.pk).update(
                merged_into=target,
                merged_at=now,
                merged_data=source_snapshots[source.pk],
            )

        return ClientProfile.objects.get(pk=target.pk)


# ---------------------------------------------------------------------------
# Undo (writes — atomic)
# ---------------------------------------------------------------------------


def undo_merge(
    target_id: int,
    *,
    performed_by: User,  # reserved for future audit logging
) -> list[ClientProfile]:
    """Undo a merge. Returns restored source profiles."""
    with transaction.atomic():
        # Use including_merged() so the target can be found even if the
        # default manager hides it; we check merged_into_id below.
        target = ClientProfile.objects.including_merged().select_for_update().filter(pk=target_id).first()
        if target is None:
            raise MergeValidationError(f"Target profile {target_id} not found.")
        if target.merged_into_id is not None:
            raise MergeValidationError("Target profile has itself been merged — cannot undo.")

        # including_merged() is required because the default manager
        # filters out merged profiles, and these sources ARE merged.
        sources = list(ClientProfile.objects.including_merged().filter(merged_into=target))
        if not sources:
            raise MergeValidationError("No merged sources to undo.")

        content_type = ContentType.objects.get_for_model(ClientProfile)
        scalar_fields = get_scalar_fields(ClientProfile)
        restored: list[ClientProfile] = []

        for source in sources:
            snapshot = source.merged_data or {}
            if not snapshot:
                logger.warning("Source %s has no merged_data snapshot — skipping.", source.pk)
                continue

            # Restore scalar fields (Django fields natively accept
            # ISO-format strings for date/datetime on save).
            for f in scalar_fields:
                if f.name in snapshot:
                    setattr(source, f.name, snapshot[f.name])

            # Restore FK relations
            for rel_info in get_fk_relations():
                key = f"_moved_{rel_info['model_label']}"
                moved_ids = snapshot.get(key, [])
                if moved_ids:
                    existing = set(rel_info["model"].objects.filter(pk__in=moved_ids).values_list("pk", flat=True))
                    if existing:
                        rel_info["model"].objects.filter(pk__in=existing).update(**{rel_info["field_name"]: source.pk})

            # Restore GFK relations
            for gfk_info in get_gfk_relations():
                key = f"_moved_{gfk_info['model_label']}"
                moved_ids = snapshot.get(key, [])
                if moved_ids:
                    existing = set(gfk_info["model"].objects.filter(pk__in=moved_ids).values_list("pk", flat=True))
                    if existing:
                        gfk_info["model"].objects.filter(pk__in=existing).update(object_id=source.pk)

            # Restore guardian permissions
            _restore_guardian_permissions(source, content_type, snapshot)

            # Clear merge markers
            source.merged_into = None
            source.merged_at = None
            source.merged_data = None
            source.save()
            restored.append(source)

        return restored


# ---------------------------------------------------------------------------
# Helpers (guardian, ReservationClient dedup)
# ---------------------------------------------------------------------------


def _dedup_reservation_clients(sources: list[ClientProfile], target: ClientProfile) -> None:
    from shelters.models.reservation import ReservationClient

    target_reservation_ids = set(
        ReservationClient.objects.filter(client_profile=target).values_list("reservation_id", flat=True)
    )
    if target_reservation_ids:
        ReservationClient.objects.filter(
            client_profile_id__in=[s.pk for s in sources],
            reservation_id__in=target_reservation_ids,
        ).delete()


def _get_guardian_perm_models() -> list[type[models.Model]]:
    try:
        from accounts.models import BigGroupObjectPermission, BigUserObjectPermission

        return [BigUserObjectPermission, BigGroupObjectPermission]
    except ImportError:
        logger.warning("Guardian permission models not available — skipping permission merge.")
        return []


def _append_guardian_permission_changes(
    sources: list[ClientProfile],
    content_type: ContentType,
    related_changes: list[RelatedChange],
) -> None:
    for perm_model in _get_guardian_perm_models():
        model: Any = perm_model
        per_source: dict[int, list[int]] = {}
        total = 0
        for source in sources:
            ids = list(
                model.objects.filter(content_type=content_type, object_pk=str(source.pk)).values_list("pk", flat=True)
            )
            per_source[source.pk] = ids
            total += len(ids)
        if total > 0:
            related_changes.append(
                RelatedChange(
                    relation_name=str(model._meta.verbose_name_plural).replace(" ", "_"),
                    model_label=f"{model._meta.app_label}.{model._meta.model_name}",
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
    for perm_model in _get_guardian_perm_models():
        model: Any = perm_model
        for source in sources:
            source_snapshots[source.pk][f"_moved_{model._meta.app_label}.{model._meta.model_name}"] = list(
                model.objects.filter(content_type=content_type, object_pk=str(source.pk)).values_list("pk", flat=True)
            )
        model.objects.filter(
            content_type=content_type,
            object_pk__in=[str(s.pk) for s in sources],
        ).update(object_pk=str(target.pk))


def _restore_guardian_permissions(
    source: ClientProfile,
    content_type: ContentType,
    snapshot: dict[str, Any],
) -> None:
    for perm_model in _get_guardian_perm_models():
        model: Any = perm_model
        key = f"_moved_{model._meta.app_label}.{model._meta.model_name}"
        moved_ids = snapshot.get(key, [])
        if moved_ids:
            existing = set(model.objects.filter(pk__in=moved_ids).values_list("pk", flat=True))
            if existing:
                model.objects.filter(pk__in=existing).update(object_pk=str(source.pk))
