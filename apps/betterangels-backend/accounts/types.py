from datetime import datetime
from typing import List, Optional

import strawberry
import strawberry_django
from common.graphql.types import NonBlankString
from organizations.models import Organization
from strawberry import ID, auto

from .models import User


@strawberry.input
class AuthInput:
    code: Optional[str] = strawberry.field(name="code")
    code_verifier: Optional[str] = strawberry.field(name="code_verifier")
    id_token: Optional[str] = strawberry.field(name="id_token")
    redirect_uri: Optional[str] = strawberry.field(name="redirect_uri")


@strawberry.type
class AuthResponse:
    status_code: str = strawberry.field(name="status_code")


@strawberry.input
class LoginInput:
    username: str
    password: str


@strawberry_django.ordering.order(Organization)
class OrganizationOrder:
    name: auto
    id: auto


@strawberry_django.type(Organization, order=OrganizationOrder)  # type: ignore[literal-required]
class OrganizationType:
    id: ID
    name: auto


@strawberry_django.type(User)
class UserBaseType:
    first_name: Optional[NonBlankString]
    last_name: Optional[NonBlankString]
    middle_name: Optional[NonBlankString]
    email: Optional[NonBlankString]


@strawberry_django.type(User)
class UserType(UserBaseType):
    # TODO: has_accepted_tos, has_accepted_privacy_policy, is_outreach_authorized shouldn't be optional.
    # Temporary fix while we figure out type generation
    id: ID
    client_profile: auto
    has_accepted_tos: Optional[bool]
    has_accepted_privacy_policy: Optional[bool]
    is_outreach_authorized: Optional[bool]
    organizations_organization: Optional[List[OrganizationType]]
    username: auto


@strawberry_django.input(User, partial=True)
class CreateUserInput(UserBaseType):
    "See parent"


@strawberry_django.input(User, partial=True)
class UpdateUserInput(UserBaseType):
    id: ID
    has_accepted_tos: auto
    has_accepted_privacy_policy: auto


# ────────────────────────────────────────────────────────────────────
# Shared Types
# ────────────────────────────────────────────────────────────────────


@strawberry.type
class Flow:
    id: str
    is_pending: Optional[bool] = None
    providers: Optional[List[str]] = None


@strawberry.type
class AuthMeta:
    is_authenticated: bool
    session_token: Optional[str] = None
    access_token: Optional[str] = None


# ────────────────────────────────────────────────────────────────────
# Request Login Code Response
# ────────────────────────────────────────────────────────────────────


@strawberry.type
class RequestLoginCodeData:
    flows: List[Flow]


@strawberry.type
class RequestLoginCodeResponse:
    status: int
    data: RequestLoginCodeData
    meta: AuthMeta


# ────────────────────────────────────────────────────────────────────
# Confirm Login Code Response
# ────────────────────────────────────────────────────────────────────


@strawberry.type
class AllAuthUser:
    id: strawberry.ID
    display: str
    has_usable_password: bool
    email: str
    username: str


@strawberry.type
class AuthMethod:
    method: str
    at: datetime
    email: Optional[str] = None


@strawberry.type
class ConfirmLoginCodeData:
    user: AllAuthUser
    methods: List[AuthMethod]


@strawberry.type
class ConfirmLoginCodeResponse:
    status: int
    data: ConfirmLoginCodeData
    meta: AuthMeta


@strawberry.input
class CodeRequestInput:
    email: str


@strawberry.input
class CodeConfirmInput:
    code: str
