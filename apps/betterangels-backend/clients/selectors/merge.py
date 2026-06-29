"""
Selectors for the client merge feature.

Follows the Hacksoft pattern: selectors fetch data from the database.
Services (merge.py) handle business logic and writes.
"""

from __future__ import annotations

from typing import Any, cast

from clients.models import ClientProfile
from common.models import Attachment, PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models.fields.reverse_related import ManyToOneRel


class MergeProfilesNotFoundError(Exception):
    """Raised by get_merge_profiles when one or more profiles are missing."""


def get_merge_profiles(
    source_ids: list[int],
    target_id: int,
    *,
    for_update: bool = False,
) -> tuple[ClientProfile, list[ClientProfile]]:
    """
    Fetch and return the target and source ClientProfiles.

    When for_update=True, uses select_for_update to prevent concurrent merges.
    Callers MUST wrap this in transaction.atomic().
    Raises MergeProfilesNotFoundError if any profile is not found.
    """
    # Use including_merged() so already-merged profiles are found and
    # can be rejected with a clear error message in _validate_merge_inputs.
    qs = ClientProfile.objects.including_merged().filter(pk__in=[target_id, *source_ids]).order_by("pk")
    if for_update:
        qs = qs.select_for_update()
    profiles = list(qs)

    target = next((p for p in profiles if p.pk == target_id), None)
    if target is None:
        raise MergeProfilesNotFoundError(f"Target profile {target_id} not found.")

    sources: list[ClientProfile] = []
    for sid in source_ids:
        source = next((p for p in profiles if p.pk == sid), None)
        if source is None:
            raise MergeProfilesNotFoundError(f"Source profile {sid} not found.")
        sources.append(source)

    return target, sources


def get_scalar_fields(model: type[models.Model]) -> list[models.Field]:
    """Return concrete, non-relational, non-excluded fields on *model*."""
    _EXCLUDED: frozenset[str] = frozenset(
        {
            "id",
            "created_at",
            "updated_at",
            "merged_into",
            "merged_at",
            "merged_data",
            "profile_photo",  # ImageField — handled separately
            "pgh_obj",
            "pgh_created_at",
            "pgh_label",
            "pgh_context",
        }
    )
    fields: list[models.Field] = []
    for f in model._meta.get_fields():
        if f.name in _EXCLUDED:
            continue
        if f.is_relation or f.auto_created or f.many_to_many or f.one_to_many or f.one_to_one:
            continue
        if not f.concrete:
            continue
        fields.append(cast(models.Field, f))
    return fields


def get_fk_relations() -> list[dict[str, Any]]:
    """Discover all ForeignKey relationships pointing TO ClientProfile."""
    relations: list[dict[str, Any]] = []
    for rel in ClientProfile._meta.related_objects:
        if not isinstance(rel, ManyToOneRel):
            continue
        fk_field = rel.field
        related_model = cast(type[models.Model], rel.related_model)
        relations.append(
            {
                "model": related_model,
                "model_label": f"{related_model._meta.app_label}.{related_model._meta.model_name}",
                "field_name": fk_field.name,
                "related_name": rel.related_name or related_model._meta.model_name,
                "on_delete": fk_field.remote_field.on_delete,
            }
        )
    return relations


def get_gfk_relations() -> list[dict[str, Any]]:
    """Return known GFK models that may point to ClientProfile."""
    return [
        {
            "model": Attachment,
            "model_label": "common.attachment",
            "content_type_field": "content_type",
            "object_id_field": "object_id",
        },
        {
            "model": PhoneNumber,
            "model_label": "common.phonenumber",
            "content_type_field": "content_type",
            "object_id_field": "object_id",
        },
    ]


def get_related_object_ids(
    rel_info: dict[str, Any],
    sources: list[ClientProfile],
    content_type: ContentType | None = None,
) -> dict[int, list[int]]:
    """Return {source_id: [object_ids]} for a given relation."""
    result: dict[int, list[int]] = {}
    if content_type is not None:
        # GFK relation
        gfk_model = rel_info["model"]
        for source in sources:
            result[source.pk] = list(
                gfk_model.objects.filter(content_type=content_type, object_id=source.pk).values_list("pk", flat=True)
            )
    else:
        # FK relation
        rel_model = rel_info["model"]
        field_name = rel_info["field_name"]
        for source in sources:
            result[source.pk] = list(rel_model.objects.filter(**{field_name: source.pk}).values_list("pk", flat=True))
    return result


def get_unique_fields() -> frozenset[str]:
    """Return the names of all unique concrete fields on ClientProfile."""
    return frozenset(f.name for f in ClientProfile._meta.get_fields() if getattr(f, "unique", False) and f.concrete)
