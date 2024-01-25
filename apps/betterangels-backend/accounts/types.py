import dataclasses

import strawberry
import strawberry_django
from strawberry import auto

from .models import User


@dataclasses.dataclass
@strawberry_django.type(User)
class UserType:
    id: auto
    username: auto
    email: auto


@dataclasses.dataclass
@strawberry.input
class MagicLinkInput:
    email: str


@dataclasses.dataclass
@strawberry.type
class MagicLinkResponse:
    message: str
