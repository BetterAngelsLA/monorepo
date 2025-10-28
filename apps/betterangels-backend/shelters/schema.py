import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from django.db.models import QuerySet
from notes.permissions import NotePermissions
from shelters.models import Shelter
from shelters.types import ShelterType
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    # modified code
    @strawberry_django.offset_paginated(
        OffsetPaginated[ShelterType],
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(NotePermissions.ADD)],
    )
    def shelters_by_organization(self, organization_id: strawberry.ID) -> QuerySet[Shelter]:
        queryset: QuerySet[Shelter] = Shelter.objects.filter(organization_id=organization_id).order_by("-created_at")
        return queryset

    #
