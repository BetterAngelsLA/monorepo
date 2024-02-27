import strawberry
import strawberry_django
from .types import ShelterType
from typing import List
from .models import Shelter
from strawberry.types import Info


@strawberry.type
class Query:
    shelter: ShelterType
    shelters: List[ShelterType] = strawberry_django.field()

    # def resolve_shelters(self, info: Info) -> List[ShelterType]:
    #     shelters = Shelter.objects.all()
    #     return [ShelterType(name=shelter.name, description=shelter.description) for shelter in shelters]
