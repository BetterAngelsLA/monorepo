from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group
from model_bakery.recipe import Recipe, foreign_key, seq
from organizations.models import Organization

organization_recipe: Recipe[Organization] = Recipe(
    Organization,
    name=seq("Organization "),  # type: ignore[no-untyped-call]
    slug=seq("organization-"),  # type: ignore[no-untyped-call]
)

permission_group_template_recipe = Recipe(
    PermissionGroupTemplate,
    name=seq("Template Name "),  # type: ignore[no-untyped-call]
)

group_recipe = Recipe(Group, name=seq("Group Name "))  # type: ignore[no-untyped-call]

permission_group_recipe = Recipe(
    PermissionGroup,
    name=seq("Permission Group Name "),  # type: ignore[no-untyped-call]
    organization=foreign_key(organization_recipe),
    group=foreign_key(group_recipe),
    template=foreign_key(permission_group_template_recipe),
)
