from typing import List

import strawberry
import strawberry_django

from .types import ShelterType


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: List[ShelterType] = strawberry_django.field()
