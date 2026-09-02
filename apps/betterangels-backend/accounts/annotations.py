from django.db.models import Case, CharField, Exists, OuterRef, StringAgg, Subquery, Value, When
from django.db.models.functions import Coalesce, Concat
from organizations.models import OrganizationOwner

from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from common.org_types import REGISTRY

from .models import Grant, PermissionGroup


def annotate_member_role(org_id: str) -> Case:
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_SUPERUSER.name,
            user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_ADMIN.name,
            user=OuterRef("pk"),
        )
    )

    return Case(
        When(is_superuser, then=Value(OrgRoleEnum.SUPERUSER)),
        When(is_admin, then=Value(OrgRoleEnum.ADMIN)),
        default=Value(OrgRoleEnum.MEMBER),
        output_field=CharField(),
    )


def annotate_is_org_owner(org_id: str) -> Exists:
    """Annotate whether the user is the organization owner."""
    return Exists(
        OrganizationOwner.objects.filter(
            organization_id=org_id,
            organization_user__user=OuterRef("pk"),
        )
    )


def annotate_permission_templates(org_id: str) -> Coalesce:
    """Return comma-separated member-level permission template names for *org_id*.

    Filters to member-level templates only (the same set exposed by
    ``PermissionTemplateEnum``), excluding org-level templates like
    Org Admin / Org Superuser which are surfaced via ``member_role``.

    Reads from BOTH authorities: legacy ``PermissionGroup`` memberships and
    ``Grant`` rows for role-backed templates (teardown, ADR 0001 §4 phase 5).
    The two sets are disjoint (role-backed templates no longer create legacy
    groups), so a plain concatenation is safe; the resolver de-dupes empties.
    """
    names = REGISTRY.invitable_template_names()
    legacy = Subquery(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            user=OuterRef("pk"),
            template__name__in=names,
        )
        .values("user")
        .annotate(names=StringAgg("template__name", Value(", "), distinct=True, order_by="template__name"))
        .values("names")
    )
    grants = Subquery(
        Grant.objects.filter(
            scope_org_id=org_id,
            principal_user=OuterRef("pk"),
            role__name__in=names,
        )
        .values("principal_user")
        .annotate(names=StringAgg("role__name", Value(", "), distinct=True, order_by="role__name"))
        .values("names")
    )
    return Coalesce(
        Concat(legacy, Value(", "), grants, output_field=CharField()),
        legacy,
        grants,
        output_field=CharField(),
    )
