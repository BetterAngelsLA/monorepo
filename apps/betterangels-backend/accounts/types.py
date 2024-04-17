import strawberry
import strawberry_django
from strawberry import auto

from .models import Client, User


@strawberry_django.type(User)
class UserType:
    id: auto
    username: auto
    first_name: auto
    last_name: auto
    email: auto


@strawberry_django.type(Client)
class ClientType(UserType):
    pass


@strawberry_django.input(User)
class UserInput:
    id: auto


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
