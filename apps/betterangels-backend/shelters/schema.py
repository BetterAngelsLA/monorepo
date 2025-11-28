import strawberry
import strawberry_django
from django.db.models import QuerySet
from common.permissions.utils import IsAuthenticated
from shelters.models import Shelter
from shelters.permissions import ShelterPermissions
from shelters.types import ShelterType
from strawberry.types import Info
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm

@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    @strawberry_django.offset_paginated(
        OffsetPaginated[ShelterType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)]
    )
    def shelters_by_organization(self, info: Info) -> QuerySet[Shelter]:
        user = info.context.request.user
        organization_id = getattr(user, "organization_id", None)
        if organization_id is None:
            return Shelter.objects.none()
        return Shelter.objects.filter(organization_id=organization_id).order_by("-created_at")
