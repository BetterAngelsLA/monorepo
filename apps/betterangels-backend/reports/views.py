"""Reports app REST views for on-demand CSV export."""

from datetime import datetime, timedelta

from accounts.permissions import UserOrganizationPermissions
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils import timezone
from notes.admin import NoteResource
from notes.models import Note
from organizations.models import Organization


def _get_org_and_check_permission(request: HttpRequest) -> Organization | JsonResponse:
    """Validate the user has an org and ACCESS_ORG_PORTAL permission. Returns org or error response."""
    user = request.user
    org = Organization.objects.filter(users=user).first()
    if not org:
        return JsonResponse({"error": "You are not a member of any organization."}, status=403)
    if not user.has_perm(UserOrganizationPermissions.ACCESS_ORG_PORTAL, org):
        return JsonResponse({"error": "You do not have permission to export reports."}, status=403)
    return org


def _parse_date_range(request: HttpRequest) -> tuple[datetime, datetime] | JsonResponse:
    """
    Parse date range from query params.

    Supports two modes:
      1. start_date & end_date (YYYY-MM-DD format, end_date is inclusive)
      2. month & year (legacy, single-month export)

    Returns (start_date, end_date_exclusive) or a JsonResponse error.
    """
    start_str = request.GET.get("start_date")
    end_str = request.GET.get("end_date")

    if start_str and end_str:
        try:
            start = datetime.strptime(start_str, "%Y-%m-%d")
            end = datetime.strptime(end_str, "%Y-%m-%d")
        except ValueError:
            return JsonResponse({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)

        if start > end:
            return JsonResponse({"error": "start_date must be before or equal to end_date."}, status=400)

        start_date = timezone.make_aware(datetime(start.year, start.month, start.day))
        # end_date is inclusive, so make it exclusive by going to next day
        end_plus_one = datetime(end.year, end.month, end.day) + timedelta(days=1)
        end_date = timezone.make_aware(end_plus_one)
        return (start_date, end_date)

    # Fallback to month/year params
    now = timezone.now()
    default_month = (now.month - 1) or 12
    default_year = now.year if now.month > 1 else now.year - 1

    try:
        month = int(request.GET.get("month", default_month))
        year = int(request.GET.get("year", default_year))
    except (ValueError, TypeError):
        return JsonResponse({"error": "Invalid month or year parameter."}, status=400)

    if not (1 <= month <= 12):
        return JsonResponse({"error": "Month must be between 1 and 12."}, status=400)
    if not (2000 <= year <= 2100):
        return JsonResponse({"error": "Year must be between 2000 and 2100."}, status=400)

    start_date = timezone.make_aware(datetime(year, month, 1))
    if month == 12:
        end_date = timezone.make_aware(datetime(year + 1, 1, 1))
    else:
        end_date = timezone.make_aware(datetime(year, month + 1, 1))

    return (start_date, end_date)


@login_required
def export_interaction_data(request: HttpRequest) -> HttpResponse:
    """
    Export interaction data as CSV for the user's organization.

    Query parameters (date range mode):
        start_date (str): Start date in YYYY-MM-DD format (inclusive).
        end_date (str): End date in YYYY-MM-DD format (inclusive).

    Query parameters (legacy month mode):
        month (int): Month number (1-12). Defaults to the previous month.
        year (int): Four-digit year. Defaults to the year of the previous month.

    Requires the ACCESS_ORG_PORTAL permission on the user's organization.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    result = _get_org_and_check_permission(request)
    if isinstance(result, JsonResponse):
        return result
    org = result

    date_result = _parse_date_range(request)
    if isinstance(date_result, JsonResponse):
        return date_result
    start_date, end_date = date_result

    notes = Note.objects.filter(
        interacted_at__gte=start_date,
        interacted_at__lt=end_date,
        organization=org,
    ).order_by("interacted_at")

    resource = NoteResource()
    dataset = resource.export(queryset=notes)

    start_str = start_date.strftime("%Y%m%d")
    end_str = (end_date - timedelta(days=1)).strftime("%Y%m%d")
    filename = f"interaction_data_{start_str}_{end_str}.csv"

    response = HttpResponse(dataset.csv, content_type="text/csv")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response
