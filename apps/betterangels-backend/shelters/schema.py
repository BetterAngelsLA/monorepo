import strawberry
import strawberry_django
from common.permissions.utils import IsAuthenticated
from shelters.permissions import ShelterPermissions
from shelters.types import AdminShelterType, ShelterType
from strawberry_django.pagination import OffsetPaginated
from strawberry_django.permissions import HasPerm


@strawberry.type
class Query:
    admin_shelters: OffsetPaginated[AdminShelterType] = strawberry_django.offset_paginated(
        permission_classes=[IsAuthenticated],
        extensions=[HasPerm(ShelterPermissions.VIEW)],
    )

    shelters: OffsetPaginated[ShelterType] = strawberry_django.offset_paginated()

    shelter: ShelterType = strawberry_django.field()
