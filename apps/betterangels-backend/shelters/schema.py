import strawberry
import strawberry_django
from strawberry.types import Info

from shelters.enums import StatusChoices
from common.permissions.utils import IsAuthenticated
from django.db.models import QuerySet
from notes.permissions import NotePermissions
from shelters.models import Shelter
from shelters.types import ShelterType
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm
from shelters.permissions import ShelterPermissions


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()

    @strawberry_django.offset_paginated(OffsetPaginated[ShelterType])
    def shelters(self) -> QuerySet:
        return Shelter.objects.filter(status=StatusChoices.APPROVED)

    @strawberry_django.offset_paginated(
        OffsetPaginated[ShelterType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )
    def shelters_by_organization(
        self,
        info: Info,
        organization_id: strawberry.ID, 
    ) -> QuerySet[Shelter]:
        user = info.context.request.user
        user_org_id = getattr(user, "organization_id", None)
        effective_org_id = user_org_id or int(organization_id)

        return (
            Shelter.objects
            .filter(organization_id=effective_org_id)
            .order_by("-created_at")
        )
