from typing import Optional

import strawberry
from strawberry_django import auth

from .types import UserType


@strawberry.type
class Query:
    current_user: Optional[UserType] = auth.current_user()
    logout = auth.logout()
