"""
Reports app API views.

APIs should be thin — validation via serializers, logic via selectors/services.

Reference: https://github.com/HackSoftware/Django-Styleguide#apis--serializers
"""

from datetime import datetime, timedelta

from django.http import HttpResponse
from django.utils import timezone
from notes.admin import NoteResource
from organizations.models import Organization
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.views import APIView

from .permissions import HasOrgPortalAccess
from .selectors import note_list_for_org


class ExportInteractionDataApi(APIView):
    """
    GET /reports/export/

    Export interaction data as CSV for the authenticated user's organization.
    """

    permission_classes = [IsAuthenticated, HasOrgPortalAccess]

    class InputSerializer(serializers.Serializer):
        start_date = serializers.DateField(required=False)
        end_date = serializers.DateField(required=False)
        # Legacy single-month params
        month = serializers.IntegerField(required=False, min_value=1, max_value=12)
        year = serializers.IntegerField(required=False, min_value=2000, max_value=2100)

        def validate(self, attrs):  # type: ignore[override]
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

        org = Organization.objects.filter(users=request.user).first()
        notes = note_list_for_org(org=org, start_date=start_date, end_date=end_date).order_by("interacted_at")

        resource = NoteResource()
        dataset = resource.export(queryset=notes)

        start_str = start_date.strftime("%Y%m%d")
        end_str = end_date.strftime("%Y%m%d")
        filename = f"interaction_data_{start_str}_{end_str}.csv"

        response = HttpResponse(dataset.csv, content_type="text/csv")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
