from typing import Optional

import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.db.models import QuerySet
from shelters.enums import StatusChoices
from shelters.models import Shelter
from shelters.permissions import ShelterPermissions
from shelters.types import ShelterOrder, ShelterType
from strawberry.types import Info
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self, ordering: Optional[list[ShelterOrder]] = None) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)

    admin_shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )

    @strawberry_django.offset_paginated(
        OffsetPaginated[ShelterType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )
    def shelters_by_organization(self, info: Info) -> QuerySet[Shelter]:
        user = info.context.request.user
        # Get all organizations the user belongs to (many-to-many relationship)
        user_orgs = user.organizations_organization.all()
        if not user_orgs.exists():
            return Shelter.objects.none()
        # Return shelters for all of the user's organizations
        return Shelter.objects.filter(organization__in=user_orgs).order_by("-created_at")
