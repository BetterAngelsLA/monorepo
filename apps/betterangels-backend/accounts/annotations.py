from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import Case, CharField, Exists, OuterRef, Q, Value, When
from organizations.models import OrganizationOwner

from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from common.org_types import REGISTRY

from .models import PermissionGroup


def annotate_member_role(org_id: str) -> Case:
    is_superuser = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_SUPERUSER.name,
            group__user=OuterRef("pk"),
        )
    )
    is_admin = Exists(
        PermissionGroup.objects.filter(
            organization_id=org_id,
            template__name=ORG_ADMIN.name,
            group__user=OuterRef("pk"),
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


def annotate_permission_templates(org_id: str) -> ArrayAgg:
    """Return the user's invitable permission template names for *org_id*.

    Filters to member-level templates only (the same set exposed by
    ``PermissionTemplateEnum``), excluding org-level templates like
    Org Admin / Org Superuser which are surfaced via ``member_role``.
    """
    return ArrayAgg(
        "permission_groups__template__name",
        filter=Q(
            permission_groups__organization_id=org_id,
            permission_groups__template__name__in=REGISTRY.invitable_template_names(),
        ),
        distinct=True,
    )
