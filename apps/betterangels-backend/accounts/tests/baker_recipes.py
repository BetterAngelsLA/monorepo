from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group
from model_bakery.random_gen import gen_string
from model_bakery.recipe import Recipe, foreign_key
from organizations.models import Organization

from .helpers import make_org_with_presets


class OrgRecipe(Recipe[Organization]):
    """Recipe that delegates to create_organization_with_presets via the helper."""

    _model = Organization

    def make(self, **attrs):
        return make_org_with_presets(**attrs)


organization_recipe = OrgRecipe(Organization)

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
