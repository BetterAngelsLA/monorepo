from accounts.enums import OrgRoleEnum
from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from django.db.models import Case, CharField, Exists, OuterRef, Value, When
from organizations.models import OrganizationOwner

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
