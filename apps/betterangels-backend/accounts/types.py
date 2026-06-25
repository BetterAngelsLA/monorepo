from __future__ import annotations

from enum import Enum
from typing import List, Optional, Tuple

import strawberry
import strawberry_django
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.types import NonBlankString, NonEmptyString
from common.org_types import REGISTRY
from django.db.models import Q, QuerySet
from notes.groups import CASEWORKER
from organizations.models import Organization
from reports.permissions import ReportPermissions
from shelters.permissions import ShelterPermissions
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user
from teams.permissions import TeamPermissions

from accounts.enums import OrgRoleEnum
from accounts.models import PermissionGroup
from accounts.permissions import _annotation_key, permission_annotations

from .models import User
from .permissions import UserOrganizationPermissions

# All permission enums whose values are returned in the org's permissions list.
# To add a new permission domain, add its enum here — no other changes needed.
ORG_PERMISSION_ENUMS = [
    UserOrganizationPermissions,
    ReportPermissions,
    ShelterPermissions,
    TeamPermissions,
]


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


@strawberry_django.filter_type(User)
class OrganizationMemberFilter:
    @strawberry_django.filter_field
    def search(
        self,
        queryset: QuerySet[User],
        info: Info,
        value: Optional[str],
        prefix: str,
    ) -> Tuple[QuerySet[User], Q]:

        if value is None or len(value.strip()) < 2:
            return queryset, Q()

        search_terms = value.split()

        query = Q()
        for term in search_terms:
            query &= Q(first_name__icontains=term) | Q(last_name__icontains=term) | Q(email__icontains=term)

        return queryset.filter(query), Q()


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
        if not user or not user.is_authenticated:
            return queryset.none()

        assert isinstance(user, User)
        qs: QuerySet[Organization] = queryset.filter(users=user)
        for enum in ORG_PERMISSION_ENUMS:
            qs = qs.annotate(**permission_annotations(user, enum))
        return qs

    @strawberry_django.field
    def permissions(self, info: Info) -> List[str]:
        perms: List[str] = []
        for enum in ORG_PERMISSION_ENUMS:
            for perm in enum:
                if getattr(self, _annotation_key(perm), False):
                    perms.append(perm.value)
        return perms


@strawberry_django.type(User)
class UserBaseType:
    first_name: Optional[NonBlankString]
    last_name: Optional[NonBlankString]
    middle_name: Optional[NonBlankString]
    email: Optional[NonBlankString]


@strawberry_django.type(User)
class UserType(UserBaseType):
    id: ID
    organizations_organization: Optional[List[OrganizationType]]
    has_accepted_tos: Optional[bool]
    has_accepted_privacy_policy: Optional[bool]
    username: Optional[str]

    @strawberry_django.field
    def is_hmis_user(self, info: Info) -> Optional[bool]:
        request = info.context["request"]
        session = request.session

        return bool(session.get(HMIS_SESSION_KEY_NAME, None))

    @strawberry_django.field(deprecation_reason="Use userPermissions check instead.")
    def is_outreach_authorized(self, info: Info) -> Optional[bool]:
        """Backwards-compatible field for old mobile clients.

        Returns True if the user belongs to a Caseworker permission group
        in any organization (i.e., they are an outreach worker).

        TODO: Remove this field once mobile clients have migrated.
        """
        user = get_current_user(info)
        if not user or not user.is_authenticated:
            return None
        return PermissionGroup.objects.filter(
            group__user=user.pk,
            template__name=CASEWORKER.name,
        ).exists()


@strawberry_django.type(User)
class CurrentUserType(UserBaseType):
    id: ID
    organizations_organization: Optional[List[CurrentUserOrganizationType]]
    has_accepted_tos: Optional[bool]
    has_accepted_privacy_policy: Optional[bool]
    username: Optional[str]

    @strawberry_django.field
    def is_hmis_user(self, info: Info) -> Optional[bool]:
        request = info.context["request"]
        session = request.session

        return bool(session.get(HMIS_SESSION_KEY_NAME, None))

    @strawberry_django.field(deprecation_reason="Use userPermissions check instead.")
    def is_outreach_authorized(self, info: Info) -> Optional[bool]:
        """Backwards-compatible field for old clients.

        Returns True if the user belongs to a Caseworker permission group
        in any organization (i.e., they are an outreach worker).

        TODO: Remove this field once mobile clients have migrated.
        """
        user = get_current_user(info)
        if not user or not user.is_authenticated:
            return None
        return PermissionGroup.objects.filter(
            group__user=user.pk,
            template__name=CASEWORKER.name,
        ).exists()


@strawberry_django.order_type(User, one_of=False)
class OrganizationMemberOrdering:
    id: auto
    email: auto
    first_name: auto
    last_login: auto
    last_name: auto
    date_joined: auto

    @strawberry_django.order_field
    def member_role(
        self,
        info: Info,
        queryset: QuerySet,
        value: auto,
        prefix: str,
    ) -> tuple[QuerySet[User], list[strawberry_django.Ordering]]:
        return queryset, [value.resolve(f"{prefix}_member_role")]


@strawberry_django.type(
    User,
    pagination=True,
    ordering=OrganizationMemberOrdering,
    filters=OrganizationMemberFilter,
)
class OrganizationMemberType(UserBaseType):
    id: ID
    last_login: auto
    date_joined: auto

    @strawberry_django.field
    def member_role(self, info: Info) -> OrgRoleEnum:
        return OrgRoleEnum(getattr(self, "_member_role", OrgRoleEnum.MEMBER.value))

    @strawberry_django.field
    def is_org_owner(self, info: Info) -> bool:
        """Whether this member is the organization owner."""
        return bool(getattr(self, "_is_org_owner", False))

    @strawberry_django.field
    def permission_templates(self, info: Info) -> list[PermissionTemplateEnum]:  # type: ignore[valid-type]
        raw = getattr(self, "_permission_templates", None)
        if not raw:
            return []
        return [PermissionTemplateEnum(v) for v in raw.split(", ")]


@strawberry_django.input(User, partial=True)
class CreateUserInput(UserBaseType):
    "See parent"


@strawberry_django.input(User, partial=True)
class UpdateUserInput(UserBaseType):
    id: ID
    has_accepted_tos: auto
    has_accepted_privacy_policy: auto


# Dynamically built from the registry — adding a template to
# common.org_types.REGISTRY automatically exposes it here.
PermissionTemplateEnum = strawberry.enum(  # type: ignore[call-overload]
    Enum(
        "PermissionTemplateEnum",  # type: ignore[arg-type]
        {name.upper().replace(" ", "_"): name for name in REGISTRY.invitable_template_names()},
    )
)


@strawberry.input
class OrgInvitationInput:
    email: str
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    organization_id: ID
    permission_template: PermissionTemplateEnum  # type: ignore[valid-type]


@strawberry.input
class UpdateUserProfileInput:
    first_name: Optional[NonEmptyString] = strawberry.UNSET
    last_name: Optional[NonEmptyString] = strawberry.UNSET


@strawberry.input
class RemoveOrganizationMemberInput:
    id: ID
    organization_id: ID


# ── Self-Signup ───────────────────────────────────────────────────────


@strawberry.input
class CreateOrganizationInput:
    organization_name: NonEmptyString
    org_type: NonEmptyString


@strawberry.type
class CreateOrganizationResponse:
    user: UserType
    organization: OrganizationType


# ── Role Change ───────────────────────────────────────────────────────


@strawberry.input
class ChangeOrganizationMemberRoleInput:
    user_id: ID
    organization_id: ID
    permission_template: PermissionTemplateEnum  # type: ignore[valid-type]
