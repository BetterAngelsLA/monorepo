import strawberry
import strawberry_django
from strawberry import auto

from .models import User


@strawberry_django.type(User)
class UserType:
    id: auto
    username: auto
    email: auto


@strawberry.input
class MagicLinkInput:
    email: str


@strawberry.type
class MagicLinkResponse:
    message: str
