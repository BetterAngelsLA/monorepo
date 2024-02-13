from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group
from model_bakery.random_gen import gen_string
from model_bakery.recipe import Recipe, foreign_key
from organizations.models import Organization

organization_recipe: Recipe[Organization] = Recipe(
    Organization,
    name=lambda: gen_string(50),
    slug=lambda: gen_string(50),
)

permission_group_template_recipe = Recipe(
    PermissionGroupTemplate,
    name=lambda: gen_string(50),
)

group_recipe = Recipe(
    Group,
    name=lambda: gen_string(50),
)

permission_group_recipe = Recipe(
    PermissionGroup,
    name=lambda: gen_string(50),
    organization=foreign_key(organization_recipe),
)
