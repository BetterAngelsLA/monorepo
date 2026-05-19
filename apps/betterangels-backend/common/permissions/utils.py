from __future__ import annotations

from typing import Any, Sequence, Tuple, Type

import strawberry
from common.errors import UnauthenticatedGQLError
from django.contrib.auth.models import Group
from django.db.models import Model, TextChoices
from django.utils.encoding import force_str
from guardian.shortcuts import assign_perm
from strawberry_django.auth.utils import get_current_user


def perm(codename: str, description: str) -> str:
    """Declare a custom permission on a PermissionSet subclass.

    Returns a tuple at runtime for ``contribute_to_class`` to process.
    Typed as ``str`` so Pylance/mypy sees the attribute as a permission string,
    enabling full IDE autocomplete.
    """
    return (codename, description)  # type: ignore[return-value]


class PermissionSet:
    """Base class for typed model permission sets.

    Declare as an inner ``perms`` class on each model.  Standard CRUD
    permissions (ADD, CHANGE, DELETE, VIEW) are populated automatically
    from ``model._meta.default_permissions`` at class-creation time.

    For custom permissions, use :func:`perm`::

        class Shelter(BaseModel):
            class perms(PermissionSet):
                VIEW_PRIVATE = perm("view_private_shelter", "Can view private shelters")

        Shelter.perms.VIEW          # "shelters.view_shelter"   (auto CRUD)
        Shelter.perms.VIEW_PRIVATE  # "shelters.view_private_shelter" (custom)
    """

    ADD: str
    CHANGE: str
    DELETE: str
    VIEW: str
    _perm_labels: dict[str, str]

    @classmethod
    def contribute_to_class(cls, model: type[Model], name: str) -> None:
        if model._meta.abstract:
            setattr(model, name, cls)
            return

        app = model._meta.app_label
        model_name = model._meta.model_name

        # Labels mapping: codename -> human-readable name (used by migration utilities)
        labels: dict[str, str] = {}

        # Set standard CRUD permissions
        for action in model._meta.default_permissions:
            codename = f"{action}_{model_name}"
            setattr(cls, action.upper(), f"{app}.{codename}")
            labels[codename] = f"Can {action} {model._meta.verbose_name}"

        # Process custom permissions declared via perm()
        custom_perms: list[tuple[str, str]] = []
        for attr_name in list(vars(cls)):
            value = vars(cls)[attr_name]
            if isinstance(value, tuple) and len(value) == 2 and all(isinstance(v, str) for v in value):
                codename, description = value
                setattr(cls, attr_name, f"{app}.{codename}")
                custom_perms.append((codename, description))
                labels[codename] = description

        # Register custom permissions in Meta so Django creates them in the DB
        if custom_perms:
            existing = list(model._meta.permissions)
            existing.extend(custom_perms)
            model._meta.permissions = existing

        cls._perm_labels = labels
        setattr(model, name, cls)

    @classmethod
    def codenames(cls) -> list[str]:
        """Return all permission codenames (without the app label prefix)."""
        return [
            v.split(".")[1]
            for k, v in vars(cls).items()
            if not k.startswith("_") and isinstance(v, str) and "." in v
        ]


def _auto_create_perms(sender: type[Model], **kwargs: Any) -> None:
    """Initialize PermissionSet on concrete models when class_prepared fires.

    Handles two cases:
    1. Model declares its own ``class perms(PermissionSet)`` — call contribute_to_class on it.
    2. Model inherits perms from an abstract parent — create a new subclass and initialize.
    """
    if sender._meta.abstract:
        return

    # Case 1: model has its own perms declaration
    own_perms = sender.__dict__.get("perms")
    if own_perms is not None and isinstance(own_perms, type) and issubclass(own_perms, PermissionSet):
        own_perms.contribute_to_class(sender, "perms")
        return

    # Case 2: model inherits perms from a parent (e.g. BaseModel)
    inherited = getattr(sender, "perms", None)
    if inherited is not None and isinstance(inherited, type) and issubclass(inherited, PermissionSet):
        perms_cls: type[PermissionSet] = type(f"{sender.__name__}Perms", (PermissionSet,), {})
        perms_cls.contribute_to_class(sender, "perms")


# Connect at import time so it fires for all model class preparations.
from django.db.models.signals import class_prepared  # noqa: E402

class_prepared.connect(_auto_create_perms)


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
