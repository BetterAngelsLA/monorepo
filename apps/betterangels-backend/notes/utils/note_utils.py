from typing import Any

from notes.models import OrganizationService
from organizations.models import Organization


def get_service_args(service_request_data: dict[str, Any], organization: Organization) -> dict[str, Any]:
    service_args = {}

    if service_id := service_request_data["service_id"]:
        org_service = OrganizationService.objects.get(id=str(service_id))
        service_args["service"] = service_id

    if service_other := service_request_data["service_other"]:
        org_service, _ = OrganizationService.objects.get_or_create(
            label=service_other,
            organization=organization,
        )
        service_args["service"] = str(org_service.pk)  # type: ignore

    return service_args
