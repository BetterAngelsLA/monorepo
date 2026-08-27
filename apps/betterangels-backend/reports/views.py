"""
Reports app API views.

APIs should be thin — validation via serializers, logic via selectors/services.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from datetime import datetime, timedelta
from typing import Any, cast

from accounts.models import User
from django.core.exceptions import ObjectDoesNotExist
from django.http import HttpResponse
from django.utils import timezone
from notes.admin import NoteResource
from rest_framework import serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView
from shelters.models import Shelter
from shelters.selectors import shelter_get, shelter_metrics_window, shelter_occupancy_metrics

from .export_options import MetricsExportOptions
from .metrics_export import EXPORT_CONTENT_TYPES, shelter_metrics_export
from .permissions import HasReportAccess
from .selectors import note_list_for_org


class ExportInteractionDataApi(APIView):
    """
    GET /reports/export/

    Export interaction data as CSV for the authenticated user's organization.
    """

    permission_classes = [IsAuthenticated, HasReportAccess]

    class InputSerializer(serializers.Serializer):
        start_date = serializers.DateField(required=False)
        end_date = serializers.DateField(required=False)
        # Legacy single-month params
        month = serializers.IntegerField(required=False, min_value=1, max_value=12)
        year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)

        def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:  # type: ignore[override]
            start = attrs.get("start_date")
            end = attrs.get("end_date")

            if start and end:
                if start > end:
                    raise serializers.ValidationError("start_date must be before or equal to end_date.")
                attrs["_resolved_start"] = start
                attrs["_resolved_end"] = end
                return attrs

            # Fallback to month/year (legacy)
            now = timezone.now()
            month = attrs.get("month", (now.month - 1) or 12)
            year = attrs.get("year", now.year if now.month > 1 else now.year - 1)

            attrs["_resolved_start"] = datetime(year, month, 1).date()
            if month == 12:
                attrs["_resolved_end"] = (datetime(year + 1, 1, 1) - timedelta(days=1)).date()
            else:
                attrs["_resolved_end"] = (datetime(year, month + 1, 1) - timedelta(days=1)).date()
            return attrs

    def get(self, request: Request) -> HttpResponse:
        serializer = self.InputSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        start_date = serializer.validated_data["_resolved_start"]
        end_date = serializer.validated_data["_resolved_end"]

        org = request.permitted_org  # type: ignore[attr-defined]  # set by HasReportAccess
        notes = note_list_for_org(org=org, start_date=start_date, end_date=end_date).order_by("interacted_at")

        resource = NoteResource()
        dataset = resource.export(queryset=notes)

        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        filename = f"interaction_data_{start_str}_{end_str}.csv"

        response = HttpResponse(dataset.csv, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class ShelterMetricsExportApi(APIView):
    """
    GET /reports/shelters/<shelter_id>/export/

    Export a shelter's occupancy metrics as csv (zipped, one file per metric),
    xlsx (one sheet per metric) or json.
    """

    permission_classes = [IsAuthenticated]

    class InputSerializer(serializers.Serializer):
        start_date = serializers.DateField(required=False)
        end_date = serializers.DateField(required=False)
        export_format = serializers.ChoiceField(choices=sorted(EXPORT_CONTENT_TYPES))
        # Omitted (or empty) means every metric — a query string cannot tell
        # an absent key from an empty one.
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
        metrics = shelter_occupancy_metrics(shelter=shelter, start=start, end=end)

        # MultipleChoiceField hands back a set, so filter the enum instead of
        # iterating it — otherwise sheet order varies between identical requests.
        selected = serializer.validated_data.get("include")
        options = [option for option in MetricsExportOptions if not selected or option.value in selected]

        filename, content_type, body = shelter_metrics_export(
            metrics=metrics,
            options=options,
            export_format=serializer.validated_data["export_format"],
        )

        response = HttpResponse(body, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
