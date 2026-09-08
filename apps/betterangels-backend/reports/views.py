"""
Reports app API views.

APIs should be thin — validation via serializers, logic via selectors/services.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from datetime import date, timedelta
from typing import Any

from django.http import HttpResponse
from django.utils import timezone
from notes.admin import NoteResource
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView
from .permissions import HasReportAccess
from .selectors import note_list_for_org, report_month_range


def _resolve_range(data: dict[str, Any]) -> tuple[date, date]:
    """The requested range, or the previous month."""
    if data.get("start_date") and data.get("end_date"):
        return data["start_date"], data["end_date"]

    previous_month = timezone.localdate().replace(day=1) - timedelta(days=1)
    return report_month_range(
        year=data.get("year", previous_month.year),
        month=data.get("month", previous_month.month),
    )


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

            if start and end and start > end:
                raise serializers.ValidationError("start_date must be before or equal to end_date.")

            return attrs

    def get(self, request: Request) -> HttpResponse:
        serializer = self.InputSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        org = request.permitted_org  # type: ignore[attr-defined]  # set by HasReportAccess
        start_date, end_date = _resolve_range(serializer.validated_data)

        notes = note_list_for_org(org=org, start_date=start_date, end_date=end_date).order_by("interacted_at")

        resource = NoteResource()
        dataset = resource.export(queryset=notes)

        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        filename = f"interaction_data_{start_str}_{end_str}.csv"

        response = HttpResponse(dataset.csv, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
