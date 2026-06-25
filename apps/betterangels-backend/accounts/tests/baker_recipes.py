from typing import Any, Optional, Union, overload

from accounts.models import PermissionGroup, PermissionGroupTemplate
from django.contrib.auth.models import Group
from model_bakery.random_gen import gen_string
from model_bakery.recipe import Recipe, foreign_key
from organizations.models import Organization

from .helpers import make_org_with_presets


class OrgRecipe(Recipe[Organization]):
    """Recipe that delegates to create_organization_with_presets via the helper."""

    _model = Organization

    @overload
    def make(
        self,
        _quantity: None = None,
        make_m2m: bool = ...,
        _refresh_after_create: bool = ...,
        _create_files: bool = ...,
        _using: str = ...,
        _bulk_create: bool = ...,
        _save_kwargs: Optional[dict[str, Any]] = ...,
        **attrs: Any,
    ) -> Organization: ...

    @overload
    def make(
        self,
        _quantity: int,
        make_m2m: bool = ...,
        _refresh_after_create: bool = ...,
        _create_files: bool = ...,
        _using: str = ...,
        _bulk_create: bool = ...,
        _save_kwargs: Optional[dict[str, Any]] = ...,
        **attrs: Any,
    ) -> list[Organization]: ...

    def make(
        self,
        _quantity: Union[int, None] = None,
        make_m2m: bool = False,
        _refresh_after_create: bool = False,
        _create_files: bool = False,
        _using: str = "",
        _bulk_create: bool = False,
        _save_kwargs: Optional[dict[str, Any]] = None,
        **attrs: Any,
    ) -> Union[Organization, list[Organization]]:  # type: ignore[override]
        if _quantity is not None:
            return [make_org_with_presets(**attrs) for _ in range(_quantity)]
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
