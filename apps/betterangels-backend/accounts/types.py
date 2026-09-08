from __future__ import annotations

from enum import Enum
from typing import List, Optional, Tuple, cast

import strawberry
import strawberry_django
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.types import NonBlankString, NonEmptyString
from common.org_types import REGISTRY
from django.db.models import Q, QuerySet
from notes.groups import CASEWORKER
from organizations.models import Organization
from strawberry import ID, Info, auto
from strawberry_django.auth.utils import get_current_user

from accounts.enums import OrgRoleEnum
from accounts.models import PermissionGroup

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
        """The FE org list / switcher for *info*'s user (ADR 0001 §5.2).

        Builds from the FULL ``Organization`` table, not the caller's
        queryset: the ``currentUser.organizationsOrganization`` field hands
        this the user's membership relation, which is empty for a non-member
        grant holder.  Returns the FINITE switchable set — membership, direct
        grants, inherited delegations — the orgs the user can select as an
        org-scoped context; it is never expanded to every org for a global
        holder (their reach is unscoped reads + ``currentUser.permissions``,
        ADR 0001 §5.2).  The per-org ``permissions`` field is EFFECTIVE
        (global folded in) and resolved from
        :func:`accounts.selectors.organization_effective_permissions`, so this
        stays a lazy, annotation-free filter.
        """
        from common.permissions.selectors import switchable_orgs

        user = get_current_user(info)
        if not user or not user.is_authenticated:
            return queryset.none()
        return cast(QuerySet[Organization], Organization.objects.filter(pk__in=switchable_orgs(cast(User, user))))

    @strawberry_django.field
    def permissions(self, info: Info) -> List[str]:
        """The EFFECTIVE permissions *user* can exercise at this org.

        ``global_permissions(user) ∪ org-scoped(this org)`` — the global tier is
        folded in server-side (ADR 0001 §5.2 refinement), so an org entry is the
        complete "what can I do fully here" answer (a GSO who is also a
        member/delegated at the org sees global ∪ its grants) and the FE gate is
        a single membership test, never a client union.  Computed once per
        request by :func:`accounts.selectors.organization_effective_permissions`
        (memoized on the user), bounded to the finite switchable org set.
        """
        from accounts.selectors import organization_effective_permissions

        user = cast(User, get_current_user(info))
        if not user or not user.is_authenticated:
            return []
        # ``id`` is the declared strawberry field for the org pk (typed, unlike
        # ``pk`` on this wrapper type); the report is keyed by int org id.
        return organization_effective_permissions(user).get(int(str(self.id)), [])


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
            user=user.pk,
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
    def permissions(self, info: Info) -> List[str]:
        """Global-tier permission list (ADR 0001 §2.4, finding F24).

        The shared contract for gating global-tier features: a superuser holds
        every PRODUCT-MODELED permission (the catalog the FE ``PermissionEnum``
        is generated from — never the whole DB catalog); otherwise the union of
        direct ``user_permissions`` and permissions carried by global Roles in
        ``user.groups``, bounded to the modeled set.  Scoped (grant)
        permissions are reported per organization instead.
        """
        from common.permissions.selectors import global_permissions

        user = cast(User, get_current_user(info))
        if not user or not user.is_authenticated:
            return []
        return global_permissions(user)

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
            user=user.pk,
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


PermissionTemplateEnum = strawberry.enum(
    Enum("PermissionTemplateEnum", {n.upper().replace(" ", "_"): n for n in REGISTRY.invitable_template_names()}),
)  # type: ignore[call-overload]

OrgTypeEnum = strawberry.enum(
    Enum("OrgTypeEnum", {n.upper(): n for n in REGISTRY.org_type_names()}),
)  # type: ignore[call-overload]


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
