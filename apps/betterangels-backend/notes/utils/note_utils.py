from typing import Any

from django.core.exceptions import ValidationError
from notes.models import OrganizationService
from organizations.models import Organization


def get_service_args(
    service_request_data: dict[str, Any],
    organization: Organization,
) -> dict[str, Any]:
    if service_id := service_request_data.get("service_id"):
        return {"service": service_id}

    if service_other := service_request_data.get("service_other"):
        org_service, _ = OrganizationService.objects.get_or_create(
            label=service_other,
            organization=organization,
        )
        return {"service": str(org_service.pk)}

    raise ValidationError("Service not provided")
