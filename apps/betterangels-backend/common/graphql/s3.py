"""
Generic S3 direct-upload via GraphQL.

Auto-discovers every ``S3FileField`` in the project.  No per-model views,
URLs, or serializers required — add ``S3FileField`` to any model with an
FK and it's automatically available for upload + attachment creation.

Permissions are **per field** — derived from the field's own model at every
step (e.g. ``shelters.add_interiorphoto``).

Client flow
-----------
1. ``s3UploadInitialize``  → presigned part URLs (GraphQL)
2. PUT each part → S3      (client ↔ S3, not Django)
3. ``s3UploadComplete``    → presigned completion URL (GraphQL)
4. POST complete → S3      (client ↔ S3, assembles parts)
5. ``s3UploadFinalize``    → signed ``field_value`` token (GraphQL)
6. ``createS3Attachment``  → creates the DB record (GraphQL)
"""

from __future__ import annotations

from functools import cache
from typing import Any

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.core import signing
from django.db import models
from s3_file_field._multipart import (
    MultipartManager,
    TransferredPart,
    TransferredParts,
)
from s3_file_field._registry import get_field, iter_fields
from s3_file_field.widgets import S3PlaceholderFile
from strawberry import ID, asdict
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user


# ─── Auto-discovery ──────────────────────────────────────────────────


@cache
def _discover_fields() -> dict[str, dict[str, Any]]:
    """
    Build a registry of every ``S3FileField`` that has a FK parent::

        {
            "shelters.InteriorPhoto.file": {
                "model": InteriorPhoto,
                "fk_field": "shelter",
                "parent_model": Shelter,
                "add_perm": "shelters.add_interiorphoto",
            },
            ...
        }

    Cached after first call — fields are registered at import time.
    """
    result: dict[str, dict[str, Any]] = {}
    for field in iter_fields():
        model = field.model
        meta = model._meta
        for mf in meta.get_fields():
            if isinstance(mf, models.ForeignKey):
                parent_meta = mf.related_model._meta
                result[field.id] = {
                    "model": model,
                    "fk_field": mf.name,
                    "parent_model": mf.related_model,
                    "add_perm": f"{meta.app_label}.add_{meta.model_name}",
                    "change_parent_perm": (
                        f"{parent_meta.app_label}.change_{parent_meta.model_name}"
                    ),
                }
                break
    return result


def _get_add_perm(field_id: str) -> str:
    """Return the ``add_<model>`` permission for a field_id."""
    entry = _discover_fields().get(field_id)
    if entry is None:
        raise ValueError(
            f"Unknown field_id '{field_id}'. "
            f"Valid: {', '.join(sorted(_discover_fields()))}"
        )
    return entry["add_perm"]


def _check_field_perm(info: Info, field_id: str) -> None:
    """Raise ``PermissionError`` if the user lacks ``add_<model>`` for this field."""
    user = get_current_user(info)
    perm = _get_add_perm(field_id)
    if not user.has_perm(perm):
        raise PermissionError(
            f"You do not have permission to upload to '{field_id}' "
            f"(requires {perm})."
        )


# ─── GraphQL types ───────────────────────────────────────────────────


@strawberry.type
class PresignedPartType:
    part_number: int
    size: int
    upload_url: str


@strawberry.type
class S3UploadInitResult:
    object_key: str
    upload_id: str
    parts: list[PresignedPartType]
    upload_signature: str


@strawberry.type
class S3UploadCompleteResult:
    complete_url: str
    body: str


@strawberry.type
class S3UploadFinalizeResult:
    field_value: str


@strawberry.type
class S3AttachmentResult:
    id: ID
    model_name: str
    file_name: str
    parent_id: ID


# ─── GraphQL inputs ──────────────────────────────────────────────────


@strawberry.input
class S3UploadInitInput:
    field_id: str
    file_name: str
    file_size: int
    content_type: str


@strawberry.input
class TransferredPartInput:
    part_number: int
    size: int
    etag: str


@strawberry.input
class S3UploadCompleteInput:
    upload_signature: str
    upload_id: str
    parts: list[TransferredPartInput]


@strawberry.input
class S3UploadFinalizeInput:
    upload_signature: str


@strawberry.input
class CreateS3AttachmentInput:
    field_id: str
    field_value: str
    parent_id: ID


# ─── Mutations ────────────────────────────────────────────────────────


@strawberry.type
class Mutation:

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def s3_upload_initialize(
        self, info: Info, data: S3UploadInitInput
    ) -> S3UploadInitResult:
        """
        Start a multipart upload.  Returns presigned URLs for each part.

        Permission: ``add_<model>`` for the field's model.
        """
        _check_field_perm(info, data.field_id)

        field = get_field(data.field_id)
        object_key = field.generate_filename(None, data.file_name)

        mgr = MultipartManager.from_storage(field.storage)
        init = mgr.initialize_upload(object_key, data.file_size, data.content_type)

        upload_signature = signing.dumps(
            {"field_id": data.field_id, "object_key": object_key}
        )

        return S3UploadInitResult(
            object_key=init.object_key,
            upload_id=init.upload_id,
            parts=[
                PresignedPartType(
                    part_number=p.part_number,
                    size=p.size,
                    upload_url=p.upload_url,
                )
                for p in init.parts
            ],
            upload_signature=upload_signature,
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def s3_upload_complete(
        self, info: Info, data: S3UploadCompleteInput
    ) -> S3UploadCompleteResult:
        """
        After all parts are uploaded to S3, get the presigned completion URL.

        Permission: ``add_<model>`` (derived from signed ``upload_signature``).
        """
        sig = signing.loads(data.upload_signature)
        _check_field_perm(info, sig["field_id"])

        field = get_field(sig["field_id"])
        parts = sorted(
            [TransferredPart(**asdict(p)) for p in data.parts],
            key=lambda p: p.part_number,
        )
        transferred = TransferredParts(
            parts=parts,
            object_key=sig["object_key"],
            upload_id=data.upload_id,
        )

        result = MultipartManager.from_storage(field.storage).complete_upload(
            transferred
        )
        return S3UploadCompleteResult(
            complete_url=result.complete_url, body=result.body
        )

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def s3_upload_finalize(
        self, info: Info, data: S3UploadFinalizeInput
    ) -> S3UploadFinalizeResult:
        """
        Verify the upload landed in S3 and return a signed ``field_value`` token.

        Permission: ``add_<model>`` (derived from signed ``upload_signature``).
        """
        sig = signing.loads(data.upload_signature)
        _check_field_perm(info, sig["field_id"])

        field = get_field(sig["field_id"])
        size = MultipartManager.from_storage(field.storage).get_object_size(
            sig["object_key"]
        )

        field_value = signing.dumps(
            {"object_key": sig["object_key"], "file_size": size}
        )
        return S3UploadFinalizeResult(field_value=field_value)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def create_s3_attachment(
        self, info: Info, data: CreateS3AttachmentInput
    ) -> S3AttachmentResult:
        """
        Attach an uploaded file to its parent object.

        ``field_id``    — auto-discovered model + FK (e.g. InteriorPhoto → Shelter)
        ``field_value`` — signed S3 key from ``s3UploadFinalize``
        ``parent_id``   — PK of the parent (e.g. Shelter)

        Permission: ``add_<model>`` for the field's model.
        """
        _check_field_perm(info, data.field_id)

        entry = _discover_fields()[data.field_id]
        model_class = entry["model"]
        fk_field = entry["fk_field"]
        parent_model = entry["parent_model"]

        # Verify parent exists
        try:
            parent = parent_model.objects.get(pk=data.parent_id)
        except parent_model.DoesNotExist:
            raise ValueError(
                f"{parent_model.__name__} {data.parent_id} not found."
            )

        # Decode signed token → S3 object key
        placeholder = S3PlaceholderFile.from_field(data.field_value)
        if placeholder is None:
            raise ValueError("Invalid or tampered field_value token.")

        instance = model_class.objects.create(
            file=placeholder.name,
            **{fk_field: parent},
        )

        return S3AttachmentResult(
            id=ID(str(instance.pk)),
            model_name=model_class.__name__,
            file_name=instance.file.name,
            parent_id=ID(str(data.parent_id)),
        )
