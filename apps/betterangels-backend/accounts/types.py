from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from accounts.enums import OrgRoleEnum
from accounts.groups import GroupTemplateNames
from accounts.permissions import UserOrganizationPermissions
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.types import NonBlankString
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import CharField, F, Q, QuerySet, Value
from django.db.models.functions import Concat
from organizations.models import Organization
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from .models import User

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


@strawberry_django.order_type(Organization, one_of=False)
class OrganizationOrder:
    name: auto
    id: auto


@strawberry_django.filter_type(Organization)
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


@strawberry_django.type(Organization, ordering=OrganizationOrder, filters=OrganizationFilter)
class OrganizationType:
    id: ID
    name: auto


@strawberry_django.type(Organization, ordering=OrganizationOrder, filters=OrganizationFilter, pagination=True)
class CurrentUserOrganizationType(OrganizationType):
    @classmethod
    def get_queryset(
        cls,
        queryset: QuerySet[Organization],
        info: Info,
    ) -> QuerySet[Organization]:
        user = get_current_user(info)
        if not user or not getattr(user, "pk", None):
            return queryset

        qs: QuerySet[Organization] = queryset.filter(users=user).annotate(
            user_permissions=ArrayAgg(
                Concat(
                    F("permission_groups__group__permissions__content_type__app_label"),
                    Value("."),
                    F("permission_groups__group__permissions__codename"),
                    output_field=CharField(),
                ),
                filter=Q(
                    permission_groups__group__user=user,
                    permission_groups__template__name__in=ADMIN_PORTAL_PERMISSION_GROUPS,
                ),
                distinct=True,
            )
        )

        return qs

    def resolve_user_permissions(self, info: Info) -> List[UserOrganizationPermissions]:
        perms: List[str] = getattr(self, "user_permissions", []) or []
        return [UserOrganizationPermissions(perm) for perm in perms if perm in UserOrganizationPermissions.values]

    user_permissions: Optional[List[UserOrganizationPermissions]] = strawberry_django.field(
        resolver=resolve_user_permissions
    )


@strawberry_django.type(User)
class UserBaseType:
    first_name: Optional[NonBlankString]
    last_name: Optional[NonBlankString]
    middle_name: Optional[NonBlankString]
    email: Optional[NonBlankString]


@strawberry_django.type(User)
class UserType(UserBaseType):
    id: ID
    organizations: Optional[List[OrganizationType]]
    has_accepted_tos: Optional[bool]
    has_accepted_privacy_policy: Optional[bool]
    is_outreach_authorized: Optional[bool]
    username: Optional[str]


@strawberry_django.type(User)
class CurrentUserType(UserBaseType):
    id: ID
    organizations_organization: Optional[List[CurrentUserOrganizationType]]
    organizations: Optional[List[CurrentUserOrganizationType]]
    has_accepted_tos: Optional[bool]
    has_accepted_privacy_policy: Optional[bool]
    is_outreach_authorized: Optional[bool]
    username: Optional[str]

    @strawberry_django.field
    def is_hmis_user(self, info: Info) -> Optional[bool]:
        request = info.context["request"]
        session = request.session

        return bool(session.get(HMIS_SESSION_KEY_NAME, None))


@strawberry_django.order_type(User, one_of=False)
class OrganizationMemberOrdering:
    id: auto
    email: auto
    first_name: auto
    last_login: auto
    last_name: auto

    @strawberry_django.order_field
    def member_role(
        self,
        info: Info,
        queryset: QuerySet,
        value: auto,
        prefix: str,
    ) -> tuple[QuerySet[User], list[strawberry_django.Ordering]]:
        return queryset, [value.resolve(f"{prefix}_member_role")]


@strawberry_django.type(User, pagination=True, ordering=OrganizationMemberOrdering)
class OrganizationMemberType(UserBaseType):
    id: ID
    last_login: auto

    @strawberry_django.field
    def member_role(self, info: Info) -> OrgRoleEnum:
        return OrgRoleEnum(getattr(self, "_member_role", OrgRoleEnum.MEMBER.value))


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
    email: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    organization_id: ID
