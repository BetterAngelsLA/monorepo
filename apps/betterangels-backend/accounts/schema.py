from typing import cast

import strawberry
import strawberry_django
from accounts.groups import GroupTemplateNames
from accounts.models import User
from accounts.services import send_magic_link
from common.graphql.types import DeletedObjectType
from common.permissions.utils import IsAuthenticated
from django.db import transaction
from notes.permissions import NotePermissions
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django import auth
from strawberry_django.auth.utils import get_current_user
from strawberry_django.mutations import resolvers
from strawberry_django.permissions import HasPerm
from strawberry_django.utils.requests import get_request

from .types import (
    AuthInput,
    AuthResponse,
    LoginInput,
    MagicLinkInput,
    MagicLinkResponse,
    OrganizationType,
    UpdateUserInput,
    UserType,
)


@strawberry.type
class Query:
    current_user: UserType = auth.current_user()  # type: ignore

    @strawberry.field(extensions=[HasPerm(NotePermissions.ADD)])
    def available_organizations(self, info: Info) -> list[OrganizationType]:
        return list(Organization.objects.filter(permission_groups__name__icontains=GroupTemplateNames.CASEWORKER))


@strawberry.type
class Mutation:
    logout = auth.logout()

    @strawberry.mutation
    def login(self, input: LoginInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def google_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def apple_auth(self, input: AuthInput) -> AuthResponse:
        # The is a stub and logic is handled client-side by Apollo
        return AuthResponse(status_code="")

    @strawberry.mutation
    def generate_magic_link(self, info: Info, data: MagicLinkInput) -> MagicLinkResponse:
        request = get_request(info)
        base_url = request.build_absolute_uri()
        send_magic_link(data.email, base_url)
        return MagicLinkResponse(message="Email link sent.")

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def update_current_user(self, info: Info, data: UpdateUserInput) -> UserType:
        user = cast(User, get_current_user(info))
        if str(user.pk) != str(data.id):
            raise PermissionError("You do not have permission to modify this user.")

        user_data: dict = strawberry.asdict(data)

        user = resolvers.update(
            info,
            user,
            {
                **user_data,
                "id": user.pk,
            },
        )

        return cast(UserType, user)

    @strawberry_django.mutation(permission_classes=[IsAuthenticated])
    def delete_current_user(self, info: Info) -> DeletedObjectType:
        with transaction.atomic():
            user = get_current_user(info)
            user_id = user.pk
            user.delete()

            return DeletedObjectType(id=user_id)
