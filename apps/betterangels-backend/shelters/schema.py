from typing import List

import strawberry
import strawberry_django

from .types import ShelterType


@strawberry.type
class Query:
    shelter: ShelterType = strawberry_django.field()
    shelters: list[ShelterType] = strawberry_django.field()
