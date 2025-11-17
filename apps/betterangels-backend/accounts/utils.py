from functools import cached_property
from typing import Mapping, Optional, Union

from accounts.enums import OrderingPy, OrganizationMemberOrderingField, OrgRoleEnum
from accounts.groups import GroupTemplateNames
from django.apps.registry import Apps
from django.contrib.auth.models import AbstractBaseUser, AnonymousUser, Group
from django.db import transaction
from django.db.models import Exists, F, OuterRef, QuerySet
from django.db.models.expressions import Expression, OrderBy
from django.db.models.functions import Lower
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User


def remove_organization_permission_group(organization: Organization) -> None:
    Group.objects.filter(permissiongroup__organization=organization).delete()


def add_default_org_permissions_to_user(user: User, organization: Organization) -> None:
    caseworker_permission_group, _ = PermissionGroupTemplate.objects.get_or_create(
        # TODO: This is a hack for MVP. Not all orgs will default to caseworkers
        # we will want to have a default template selected for orgs on the org model.
        name=GroupTemplateNames.CASEWORKER
    )
    org_caseworker_group, _ = PermissionGroup.objects.get_or_create(
        organization=organization, template=caseworker_permission_group
    )
    user.groups.add(org_caseworker_group.group)


def create_default_org_permission_groups(organization: Organization) -> None:
    default_templates = [
        GroupTemplateNames.CASEWORKER,
        GroupTemplateNames.ORG_ADMIN,
        GroupTemplateNames.ORG_SUPERUSER,
    ]

    for temp in default_templates:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=temp)
        PermissionGroup.objects.get_or_create(organization=organization, template=template)


def remove_org_group_permissions_from_user(user: User, organization: Organization) -> None:
    groups = Group.objects.filter(permissiongroup__organization=organization)
    user.groups.remove(*groups)


def get_user_permission_group(user: Union[AbstractBaseUser, AnonymousUser]) -> PermissionGroup:
    # WARNING: Temporary workaround for organization selection
    # TODO: Update once organization selection is implemented. Currently selects
    # the first organization with a default Caseworker role for the user.
    permission_group = (
        PermissionGroup.objects.select_related("organization", "group")
        .filter(
            organization__users=user.pk,
            name=GroupTemplateNames.CASEWORKER,
        )
        .first()
    )

    if not (permission_group and permission_group.group):
        raise PermissionError("User lacks proper organization or permissions")

    return permission_group


def get_outreach_authorized_users() -> QuerySet[User]:
    # TODO: Make unit test for this function
    authorized_permission_groups = [template.value for template in GroupTemplateNames]

    # Subquery to check if the user has any related permission group in an authorized group
    permission_group_exists = PermissionGroup.objects.filter(
        organization__users=OuterRef("pk"),  # Matches `User` to `Organization`
        template__name__in=authorized_permission_groups,
    )

    # Use Exists to avoid duplicate users without `distinct()`
    return User.objects.filter(Exists(permission_group_exists))


class OrgPermissionManager:
    """Manage org-specific user permissions."""

    def __init__(self, organization: Organization) -> None:
        self.organization: Organization = organization

    @cached_property
    def _admin_template(self) -> PermissionGroupTemplate:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=GroupTemplateNames.ORG_ADMIN)

        return template

    @cached_property
    def _superuser_template(self) -> PermissionGroupTemplate:
        template, _ = PermissionGroupTemplate.objects.get_or_create(name=GroupTemplateNames.ORG_SUPERUSER)

        return template

    @cached_property
    def _org_admin_group(self) -> PermissionGroup:
        group, _ = PermissionGroup.objects.get_or_create(
            organization=self.organization,
            template=self._admin_template,
        )

        return group

    @cached_property
    def _org_superuser_group(self) -> PermissionGroup:
        group, _ = PermissionGroup.objects.get_or_create(
            organization=self.organization,
            template=self._superuser_template,
        )

        return group

    @transaction.atomic
    def set_role(self, user: User, role: OrgRoleEnum) -> None:
        self.clear_permissions(user)

        if role == OrgRoleEnum.ADMIN:
            user.groups.add(self._org_admin_group.group)

        if role == OrgRoleEnum.SUPERUSER:
            user.groups.add(self._org_superuser_group.group)

    def clear_permissions(self, user: User) -> None:
        """Remove both admin and superuser perms."""
        user.groups.remove(self._org_admin_group.group)
        user.groups.remove(self._org_superuser_group.group)


# migration utils
def create_missing_groups_for_org(
    apps: Apps,
    current_perm_group_templates: list[GroupTemplateNames],
    new_perm_group_templates: list[GroupTemplateNames],
) -> None:
    """Creates Groups and PermissionGroups for organizations.

    Use when creating new permission group templates.

    Args:
      apps: django app registry (django.apps)
      current_perm_group_templates: List of PermissionGroupTemplates. Organizations belonging to
        any matching permission group will be updated.
      new_perm_group_templates: List of PermissionGroupTemplates. A Group and PermissionGroup will
        be created for all provided templates.
    """

    Organization = apps.get_model("organizations", "Organization")
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    for template in new_perm_group_templates:
        perm_group_template = PermissionGroupTemplate.objects.get(name=template)
        # Can't use `permissions.set(perm_group_template.permissions.all())` in a migration,
        # so we pass permission ids
        perm_ids = perm_group_template.permissions.values_list("id", flat=True)

        orgs = Organization.objects.filter(permission_groups__template__name__in=current_perm_group_templates)

        for org in orgs:
            group_name = f"{org.name}_{perm_group_template.name}"
            group, _ = Group.objects.get_or_create(name=group_name)
            group.permissions.set(perm_ids)
            PermissionGroup.objects.get_or_create(
                organization=org, template=perm_group_template, group=group, name=template
            )


Expr = Expression | F


def _direction_flags(direction: OrderingPy) -> tuple[bool, Optional[bool], Optional[bool]]:
    """Translate OrderingPy -> (descending, nulls_first, nulls_last)."""
    if direction == OrderingPy.ASC:
        return (False, None, None)
    if direction == OrderingPy.DESC:
        return (True, None, None)
    if direction == OrderingPy.ASC_NULLS_FIRST:
        return (False, True, None)
    if direction == OrderingPy.ASC_NULLS_LAST:
        return (False, None, True)
    if direction == OrderingPy.DESC_NULLS_FIRST:
        return (True, True, None)
    return (True, None, True)


def _order_by(expr: Expr, direction: OrderingPy) -> OrderBy:
    descending, nulls_first, nulls_last = _direction_flags(direction)
    return OrderBy(
        expression=expr,
        descending=descending,
        nulls_first=nulls_first,
        nulls_last=nulls_last,
    )


FIELD_TO_EXPR: Mapping[OrganizationMemberOrderingField, Expr] = {
    OrganizationMemberOrderingField.FIRST_NAME: Lower("first_name"),
    OrganizationMemberOrderingField.LAST_NAME: Lower("last_name"),
    OrganizationMemberOrderingField.EMAIL: Lower("email"),
    OrganizationMemberOrderingField.ROLE: Lower("_member_role"),
    OrganizationMemberOrderingField.LAST_LOGIN: F("last_login"),
}


def order_org_members(
    qs: QuerySet["User"],
    *,
    field: Optional[OrganizationMemberOrderingField] = None,
    direction: Optional[OrderingPy] = None,
) -> QuerySet["User"]:
    """
    Single-column ordering for organization members.

    - Text fields ordered case-insensitively via Lower(...)
    - last_login respects ASC/DESC and NULLS FIRST/LAST
    - Stable tie-break on id for deterministic pagination
    """
    field = field or OrganizationMemberOrderingField.LAST_NAME
    direction = direction or OrderingPy.ASC_NULLS_LAST

    expr = FIELD_TO_EXPR.get(field, Lower("last_name"))
    primary = _order_by(expr, direction)
    tie_break = OrderBy(F("id"))

    return qs.order_by(primary, tie_break)
