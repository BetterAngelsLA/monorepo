from django.db.models import Case, CharField, Exists, OuterRef, StringAgg, Subquery, Value, When
from organizations.models import OrganizationOwner, OrganizationUser

from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from common.org_types import REGISTRY

from .models import Grant, PermissionGroup


def annotate_member_role(org_id: str) -> Case:
    """The member's role at *org_id* — grant-only (ADR 0001 teardown).

    The ORG_ADMIN/ORG_SUPERUSER org-portal roles are read from their scoped
    ``Role`` ``Grant``s: their legacy ``PermissionGroup`` rows are retired, so a
    legacy membership can no longer report (or confer) admin.  A holder with no
    grant at the org reports MEMBER — matching what the backend enforces.
    """
    is_superuser = Exists(
        Grant.objects.filter(
            scope_org_id=org_id,
            role__name=ORG_SUPERUSER.name,
            principal_user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        Grant.objects.filter(
            scope_org_id=org_id,
            role__name=ORG_ADMIN.name,
            principal_user=OuterRef("pk"),
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


def annotate_permission_templates(org_id: str) -> Subquery:
    """Return comma-separated member-level permission template names for *org_id*.

    Filters to member-level templates only (the same set exposed by
    ``PermissionTemplateEnum``), excluding org-level templates like
    Org Admin / Org Superuser which are surfaced via ``member_role``.

    Uses ``Subquery`` + ``StringAgg`` because ``User`` has no direct FK
    to ``PermissionGroup`` — the path is ``User ↔ Group ↔ PermissionGroup``.
    """
    return Subquery(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            user=OuterRef("pk"),
            template__name__in=REGISTRY.invitable_template_names(),
        )
        .values("user")
        .annotate(names=StringAgg("template__name", Value(", "), distinct=True, order_by="template__name"))
        .values("names")
    )


def annotate_membership_id(org_id: str) -> Subquery:
    """Return the ``OrganizationUser`` row id binding a user to *org*.

    The membership row is the unit the member mutations act on: it names both
    the org and the user, so remove/change-role key on it and authorize at the
    row's org (ADR 0001 §5.3).
    """
    return Subquery(OrganizationUser.objects.filter(organization_id=org_id, user=OuterRef("pk")).values("pk")[:1])
