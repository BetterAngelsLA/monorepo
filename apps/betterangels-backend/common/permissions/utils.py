from __future__ import annotations

from typing import Any, Sequence, Tuple, Type

import strawberry
from common.errors import UnauthenticatedGQLError
from django.contrib.auth.models import Group
from django.db.models import Model, TextChoices
from django.utils.encoding import force_str
from guardian.shortcuts import assign_perm
from strawberry_django.auth.utils import get_current_user


class Permissions:
    """Descriptor for type-safe model permissions.

    Uses Django's ``contribute_to_class`` pattern (same as ``Manager`` and
    ``Field``).  Place on an abstract base model so every concrete subclass
    gets a ``perms`` attribute with typed CRUD permission constants derived
    from ``_meta``.

    For custom (non-CRUD) permissions, pass keyword arguments::

        perms = Permissions(
            VIEW_PRIVATE=("view_private_shelter", "Can view private shelters"),
        )

    Custom permissions are auto-registered in ``Meta.permissions`` so Django
    creates them in the database.

    Usage::

        class Shelter(BaseModel):
            perms = Permissions(
                VIEW_PRIVATE=("view_private_shelter", "Can view private shelters"),
            )

        Shelter.perms.VIEW          # "shelters.view_shelter"   (auto CRUD)
        Shelter.perms.VIEW_PRIVATE  # "shelters.view_private_shelter" (custom)
    """

    def __init__(self, **custom: tuple[str, str]) -> None:
        self._custom = custom  # {ENUM_NAME: (codename, description)}
        self._cache: dict[type, type[TextChoices]] = {}

    def contribute_to_class(self, model: type, name: str) -> None:
        setattr(model, name, self)
        if model._meta.abstract or not self._custom:
            return
        existing = list(model._meta.permissions)
        for codename, description in self._custom.values():
            existing.append((codename, description))
        model._meta.permissions = existing

    def __get__(self, obj: Any, model: type | None = None) -> type[TextChoices] | Permissions:
        if model is None or model._meta.abstract:
            return self
        if model not in self._cache:
            self._cache[model] = self._build_enum(model)
        return self._cache[model]

    def _build_enum(self, model: type) -> type[TextChoices]:
        app = model._meta.app_label
        model_name = model._meta.model_name
        choices: dict[str, str] = {
            action.upper(): f"{app}.{action}_{model_name}"
            for action in model._meta.default_permissions
        }
        for enum_name, (codename, _description) in self._custom.items():
            choices[enum_name] = f"{app}.{codename}"
        return TextChoices(f"{model.__name__}Perms", choices)


def permission_enums_to_django_meta_permissions(
    permission_enums: Sequence[Type[TextChoices]],
) -> Tuple[Tuple[str, str], ...]:
    """
    Converts a list of TextChoices permissions mappings to the format required for Django's Meta
    class permissions. This function extracts the permission codename and its verbose
    name from each enum in the list.

    Args:
        permission_enums (List[Type[TextChoices]]): A list of TextChoices instances mapping permissions to
        their descriptions.

    Returns:
        Tuple[Tuple[str, str], ...]: A tuple suitable for Django's Meta.permissions.
    """
    permissions: list[Tuple[str, str]] = []
    for permission_enum in permission_enums:
        permissions.extend((str(perm).rsplit(".", 1)[-1], force_str(perm.label)) for perm in permission_enum)
    return tuple(permissions)


class IsAuthenticated(strawberry.BasePermission):
    def has_permission(self, source: Any, info: strawberry.Info, **kwargs: Any) -> bool:
        user = get_current_user(info)
        if user is None or not user.is_authenticated or not user.is_active:
            raise UnauthenticatedGQLError()

        return True


def assign_object_permissions(
    group: Group,
    obj: Model,
    permissions: Sequence[str],
) -> None:
    """Assign a list of object-level permissions on ``obj`` to ``group``.

    This is a thin wrapper around ``guardian.shortcuts.assign_perm`` that
    eliminates the repeated ``for perm in perms: assign_perm(…)`` loop
    scattered across mutations and services.
    """
    for perm in permissions:
        assign_perm(perm, group, obj)
