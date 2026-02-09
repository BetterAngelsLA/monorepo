"""
REST endpoint for attaching S3-uploaded files to a Shelter.

Workflow
--------
1. Client uploads a file via ``/api/s3-upload/`` (auth-gated transport).
2. ``finalize`` returns a signed ``field_value`` token.
3. Client POSTs here with ``field_id``, ``field_value``, and ``shelter_id``.
4. Server resolves the model from the registry, checks permissions, and
   creates the media instance (InteriorPhoto / ExteriorPhoto / Video).

Permissions
-----------
``shelters.change_shelter`` — if you can edit a shelter you can manage
its media.  No per-attachment-model permission needed.

Dynamic discovery
-----------------
``field_id → model`` mapping is auto-generated from the ``s3_file_field``
registry.  Any model that declares an ``S3FileField`` **and** has a
``ForeignKey`` to ``Shelter`` is automatically valid.  No hardcoded map.
"""

from __future__ import annotations

from functools import cache

from django.db import models
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from s3_file_field._registry import iter_fields
from s3_file_field.rest_framework import S3FileSerializerField

from .models import Shelter


# ---------------------------------------------------------------------------
# Dynamic field → model discovery
# ---------------------------------------------------------------------------


@cache
def _discover_shelter_media_fields() -> dict[str, type[models.Model]]:
    """
    Return ``{ field_id: model_class }`` for every ``S3FileField`` on a
    model that has a ``ForeignKey`` to :class:`Shelter`.

    Cached after first call (fields are registered at import time).
    """
    result: dict[str, type[models.Model]] = {}
    for field in iter_fields():
        model = field.model
        for model_field in model._meta.get_fields():
            if isinstance(model_field, models.ForeignKey) and model_field.related_model is Shelter:
                result[field.id] = model
                break
    return result


# ---------------------------------------------------------------------------
# Serializer
# ---------------------------------------------------------------------------


class ShelterMediaSerializer(serializers.Serializer):
    field_id = serializers.CharField()
    field_value = S3FileSerializerField()

    def validate_field_id(self, value: str) -> str:
        valid = _discover_shelter_media_fields()
        if value not in valid:
            raise serializers.ValidationError(f"Invalid field_id. Choose from: {', '.join(sorted(valid))}")
        return value


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_shelter_media(request: Request, shelter_id: int) -> Response:
    """
    Attach an S3-uploaded file to a Shelter.

    **POST** ``/api/shelters/<shelter_id>/media/``

    .. code-block:: json

        {
            "field_id":    "shelters.InteriorPhoto.file",
            "field_value": "<signed token from /api/s3-upload/finalize/>"
        }

    Returns the created media instance.
    """
    serializer = ShelterMediaSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    field_id: str = serializer.validated_data["field_id"]
    field_value: str = serializer.validated_data["field_value"]

    # Shelter must exist
    try:
        shelter = Shelter.objects.get(pk=shelter_id)
    except Shelter.DoesNotExist:
        return Response(
            {"detail": f"Shelter {shelter_id} not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Permission: can this user edit the shelter?
    if not request.user.has_perm("shelters.change_shelter"):
        return Response(
            {"detail": "You do not have permission to modify this shelter."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Create the media record
    model_class = _discover_shelter_media_fields()[field_id]
    instance = model_class.objects.create(file=field_value, shelter=shelter)

    return Response(
        {
            "id": instance.pk,
            "model": model_class.__name__,
            "file": instance.file.name,
            "shelter_id": shelter.pk,
        },
        status=status.HTTP_201_CREATED,
    )
