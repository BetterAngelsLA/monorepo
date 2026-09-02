from __future__ import annotations

from enum import Enum
from typing import List, Optional, Tuple, cast

import strawberry
import strawberry_django
from common.constants import HMIS_SESSION_KEY_NAME
from common.graphql.types import NonBlankString, NonEmptyString
from common.org_types import REGISTRY
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import F, Q, QuerySet, Subquery, Value
from django.db.models.functions import Concat
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
        """The grants-based org list for *info*'s user.

        Builds from the FULL ``Organization`` table, not the caller's
        queryset: the ``currentUser.organizationsOrganization`` field hands
        this the user's membership relation, which is empty for a non-member
        grant holder.  Returns every org the user can act in — membership,
        direct grants, inherited delegations — and every org for global
        holders (ADR 0001 §2.6, finding F24).
        """
        user = get_current_user(info)
        if not user or not user.is_authenticated:
            return queryset.none()
        user = cast(User, user)

        from accounts.models import Grant

        base = Organization.objects.all()
        # Orgs the user acts at (member + holds a direct grant) — the source of
        # inherited delegations (ADR 0001 §2.4).  Defined for both branches so
        # the per-org annotation below stays valid SQL for global holders too.
        acting_at = Organization.objects.filter(users=user, grants__principal_user=user).values("pk")

        # Global holder: every organization is reachable; their permissions
        # are reported by the global ``currentUser.permissions`` list.
        if user.is_superuser or user.groups.filter(role__is_global=True).exists():
            qs: QuerySet[Organization] = base
        else:
            # Grants-based reachability: membership, direct user grants, and
            # delegations inherited from orgs the user acts at (ADR 0001 §2.4).
            # Pure ``pk__in`` subqueries — no joins in the filter.
            reachable = (
                Q(pk__in=Organization.objects.filter(users=user).values("pk"))
                | Q(pk__in=Grant.objects.filter(principal_user=user).values("scope_org"))
                | Q(pk__in=Grant.objects.filter(principal_org__in=Subquery(acting_at)).values("scope_org"))
            )
            qs = base.filter(reachable).distinct()

        # Annotate each org with the granted permission strings: the legacy
        # PermissionGroup memberships (authoritative for non-shelter domains
        # during the transition) plus the grant-model roles the user holds at
        # that org (authoritative for shelters).
        return cast(
            QuerySet[Organization],
            qs.annotate(
                _granted_perms=ArrayAgg(
                    Concat(
                        F("permission_groups__permissions__content_type__app_label"),
                        Value("."),
                        F("permission_groups__permissions__codename"),
                    ),
                    filter=Q(permission_groups__user=user),
                    distinct=True,
                ),
                _grant_role_perms=ArrayAgg(
                    Concat(
                        F("grants__role__permissions__content_type__app_label"),
                        Value("."),
                        F("grants__role__permissions__codename"),
                    ),
                    filter=Q(grants__principal_user=user) | Q(grants__principal_org__in=Subquery(acting_at)),
                    distinct=True,
                ),
            ),
        )

    @strawberry_django.field
    def permissions(self, info: Info) -> List[str]:
        legacy = getattr(self, "_granted_perms", []) or []
        role = getattr(self, "_grant_role_perms", []) or []
        return list(dict.fromkeys(legacy + role))


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

        The shared contract for gating global-tier features: superuser holds
        every permission; otherwise the union of direct ``user_permissions``
        and permissions carried by global Roles in ``user.groups``.  Scoped
        (grant) permissions are reported per organization instead.
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
