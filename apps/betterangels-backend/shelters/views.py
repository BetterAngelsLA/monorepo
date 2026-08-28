"""
Shelters app API views.

APIs should be thin — validation via serializers, logic via selectors/services.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from typing import Any, cast

from accounts.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from shelters.models import Shelter
from shelters.selectors import shelter_get, shelter_metrics_window, shelter_occupancy_metrics
from shelters.services.metrics_export import (
    EXPORT_CONTENT_TYPES,
    MetricsExportOptions,
    resolve_export_options,
    shelter_metrics_export,
)


class ShelterMetricsExportApi(APIView):
    """
    GET /shelters/<shelter_id>/export/

    Export a shelter's occupancy metrics as csv (zipped, one file per metric),
    xlsx (one sheet per metric) or json.
    """

    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        start_date = serializers.DateField(required=False)
        end_date = serializers.DateField(required=False)
        export_format = serializers.ChoiceField(choices=sorted(EXPORT_CONTENT_TYPES))
        # Omitted (or empty) means every metric — a query string cannot tell an
        # absent key from an empty one.
        include = serializers.MultipleChoiceField(
            choices=[option.value for option in MetricsExportOptions],
            required=False,
        )

        def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:  # type: ignore[override]
            start, end = attrs.get("start_date"), attrs.get("end_date")

            if start and end and start > end:
                raise serializers.ValidationError("start_date must be before or equal to end_date.")

            return attrs

    def get(self, request: Request, shelter_id: str) -> HttpResponse:
        serializer = self.InputSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        organization_id = getattr(request, "organization_id", None)
        if not organization_id:
            raise PermissionDenied("Organization ID (X-Organization-ID header) is required.")

        try:
            shelter = shelter_get(
                user=cast(User, request.user),
                shelter_id=shelter_id,
                organization_id=organization_id,
                permission=Shelter.perms.VIEW,
            )
        except ObjectDoesNotExist as error:
            raise NotFound(str(error))

        start, end = shelter_metrics_window(
            serializer.validated_data.get("start_date"),
            serializer.validated_data.get("end_date"),
        )

        filename, content_type, body = shelter_metrics_export(
            metrics=shelter_occupancy_metrics(shelter=shelter, start=start, end=end),
            options=resolve_export_options(serializer.validated_data.get("include")),
            export_format=serializer.validated_data["export_format"],
        )

        response = HttpResponse(body, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
