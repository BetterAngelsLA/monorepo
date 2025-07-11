from typing import List, Optional, Tuple, cast

import strawberry
import strawberry_django
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.permissions import OrganizationPortalPermissions
from common.graphql.types import NonBlankString
from django.db.models import Q, QuerySet
from organizations.models import Organization
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from .models import PermissionGroup, User

ADMIN_PORTAL_PERMISSION_GROUPS = [GroupTemplateNames.ORG_ADMIN, GroupTemplateNames.ORG_SUPERUSER]


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


@strawberry_django.filters.filter(Organization)
class OrganizationFilter:
    @strawberry_django.filter_field
    def search(
        self, queryset: QuerySet, info: Info, value: Optional[str], prefix: str
    ) -> Tuple[QuerySet[Organization], Q]:
        if value is None:
            return queryset, Q()

        search_terms = value.split()
        query = Q()

        for term in search_terms:
            q_search = Q(name__icontains=term)

            query &= q_search

        return (queryset.filter(query), Q())


@strawberry_django.type(Organization, order=OrganizationOrder, filters=OrganizationFilter)  # type: ignore[literal-required]
class OrganizationType:
    id: ID
    name: auto

    @strawberry_django.field
    def user_portal_permissions(self, info: Info) -> List[OrganizationPortalPermissions]:
        user = cast(User, get_current_user(info))
        if not user:
            return []

        try:
            pg = PermissionGroup.objects.get(
                organization=self,
                group__user=user,
                name__in=ADMIN_PORTAL_PERMISSION_GROUPS,
            )
        except PermissionGroup.DoesNotExist:
            return []

        perms = pg.group.permissions.all()

        return [
            OrganizationPortalPermissions(f"{p.content_type.app_label}.{p.codename}")
            for p in perms
            if f"{p.content_type.app_label}.{p.codename}" in OrganizationPortalPermissions.values
        ]


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


@strawberry.input
class OrgInvitationInput:
    first_name: str
    last_name: str
    email: str


@strawberry.input
class OrgMemberInput:
    id: List[ID]
    role: OrgRoleEnum
