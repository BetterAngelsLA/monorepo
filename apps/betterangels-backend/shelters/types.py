import strawberry_django
from shelters.models import Shelter
from strawberry import ID, auto


@strawberry_django.type(Shelter)
class ShelterType:
    id: ID
    name: auto
