import strawberry
import strawberry_django
from .types import ShelterType
from typing import List


@strawberry.type
class Query:
    shelter: ShelterType
    shelters: List[ShelterType] = strawberry_django.field()
