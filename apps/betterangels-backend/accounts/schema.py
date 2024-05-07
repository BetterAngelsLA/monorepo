from typing import List, cast

import strawberry
import strawberry_django
from accounts.models import ClientProfile, User
from accounts.permissions import ClientProfilePermissions
from accounts.services import send_magic_link
from django.db import transaction
from guardian.shortcuts import assign_perm
from notes.utils import get_user_permission_group
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm, HasRetvalPerm
from strawberry_django.utils.requests import get_request

from .types import (
    AuthInput,
    AuthResponse,
    ClientProfileType,
    CreateClientProfileInput,
    MagicLinkInput,
    MagicLinkResponse,
    UserType,
)


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    client_profile: ClientProfileType = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )

    client_profiles: List[ClientProfileType] = strawberry_django.field(
        extensions=[HasRetvalPerm(perms=[ClientProfilePermissions.VIEW])],
    )


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def idme_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")

    @strawberry_django.mutation(extensions=[HasPerm(perms=[ClientProfilePermissions.ADD])])
    def create_client(self, info: Info, data: CreateClientProfileInput) -> ClientProfileType:
        with transaction.atomic():
            client_profile_data: dict = strawberry.asdict(data)
            user_data = client_profile_data.pop("user") or {}

            user = get_current_user(info)
            permission_group = get_user_permission_group(user)

            client = User.objects.create_client(**user_data)

            client_profile = resolvers.create(
                info,
                ClientProfile,
                {
                    **client_profile_data,
                    "user": client,
                },
            )

            permissions = [
                ClientProfilePermissions.VIEW,
                ClientProfilePermissions.CHANGE,
                ClientProfilePermissions.DELETE,
            ]
            for perm in permissions:
                assign_perm(perm, permission_group.group, client_profile)

            return cast(ClientProfileType, client)
