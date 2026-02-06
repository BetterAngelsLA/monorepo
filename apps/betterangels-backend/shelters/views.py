from __future__ import annotations

from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from s3_file_field.rest_framework import S3FileSerializerField

from .models import ExteriorPhoto, InteriorPhoto, Shelter, Video

# Maps field_id → model class
FIELD_MODEL_MAP: dict[str, type[InteriorPhoto | ExteriorPhoto | Video]] = {
    "shelters.InteriorPhoto.file": InteriorPhoto,
    "shelters.ExteriorPhoto.file": ExteriorPhoto,
    "shelters.Video.file": Video,
}


class ShelterMediaSerializer(serializers.Serializer):
    field_id = serializers.ChoiceField(choices=list(FIELD_MODEL_MAP.keys()))
    field_value = S3FileSerializerField()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_shelter_media(request: Request, shelter_id: int) -> Response:
    """
    Create an InteriorPhoto, ExteriorPhoto, or Video for a shelter
    using a signed field_value obtained from the s3-file-field upload flow.

    POST /api/shelters/<shelter_id>/media/
    {
        "field_id": "shelters.InteriorPhoto.file",
        "field_value": "<signed value from /api/s3-upload/finalize/>"
    }
    """
    try:
        shelter = Shelter.objects.get(pk=shelter_id)
    except Shelter.DoesNotExist:
        return Response(
            {"error": f"Shelter {shelter_id} not found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    serializer = ShelterMediaSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    field_id: str = serializer.validated_data["field_id"]
    file_name: str = serializer.validated_data["field_value"]

    model_class = FIELD_MODEL_MAP[field_id]
    instance = model_class.objects.create(file=file_name, shelter=shelter)

    return Response(
        {
            "id": instance.pk,
            "model": model_class.__name__,
            "file": instance.file.name,
            "shelter_id": shelter.pk,
        },
        status=status.HTTP_201_CREATED,
    )
