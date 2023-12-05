from typing import Optional

import strawberry
from strawberry_django import auth

from .types import UserType


@strawberry.type
class Query:
    current_user: Optional[UserType] = auth.current_user()


@strawberry.type
class Mutation:
    logout = auth.logout()
