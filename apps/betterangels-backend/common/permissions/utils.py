from __future__ import annotations

from functools import reduce
from operator import or_
from typing import Any, Sequence, Tuple, Type, TypeVar

import strawberry
from django.contrib.auth.models import AbstractBaseUser, Group
from django.db.models import Exists, Model, OuterRef, Q, QuerySet, TextChoices
from django.utils.encoding import force_str
from guardian.shortcuts import assign_perm
from organizations.models import Organization
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from common.errors import UnauthenticatedGQLError


# ── Permission enum registry (frontend codegen) ───────────────────────────────

_permission_enum_registry: list[type[TextChoices]] = []


def permission_enum(cls: type[TextChoices]) -> type[TextChoices]:
    """Decorator — registers in the frontend permission const registry.

    Usage::

        @permission_enum
        class UserOrganizationPermissions(models.TextChoices):
            VIEW_ORG_MEMBERS = "organizations.view_org_members", ...
    """
    _permission_enum_registry.append(cls)
    return cls


def get_registered_permission_enums() -> list[type[TextChoices]]:
    """Return all enums registered via :func:`permission_enum`."""
    return list(_permission_enum_registry)


def register_model_permissions() -> None:
    """Auto-discover model PermissionSets and register them as TextChoices.

    Call once after Django app registry is ready (e.g. in schema.py).
    Models that declare an inner ``class perms(PermissionSet)`` are
    automatically discovered and their permission values registered
    for frontend codegen and the org permissions resolver.
    """
    from django.apps import apps

    for model in apps.get_models():
        perms_cls = getattr(model, "perms", None)
        if perms_cls is None or not isinstance(perms_cls, type):
            continue

        members: list[tuple[str, str]] = []
        for attr_name in dir(perms_cls):
            if attr_name.startswith("_") or attr_name in ("contribute_to_class",):
                continue
            value = getattr(perms_cls, attr_name, None)
            if isinstance(value, str) and "." in value:
                members.append((attr_name, value))

        if not members:
            continue

        name = f"{model.__name__}Permissions"
        # Avoid duplicate registration
        if any(e.__name__ == name for e in _permission_enum_registry):
            continue

        enum_cls = TextChoices(name, members)
        _permission_enum_registry.append(enum_cls)


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


def _perm_q(app_label: str, codename: str, *, prefix: str = "permission_groups__group__permissions") -> Q:
    """Return a Q object matching a specific Django permission.

    The default *prefix* ``permission_groups__group__permissions``
    resolves from ``Organization`` through ``PermissionGroup`` →
    ``Group`` → ``Permission`` → ``ContentType``.

    Pass ``prefix="group__permissions"`` when querying ``PermissionGroup``
    directly (e.g. in ``permission_annotations``).
    """
    return Q(
        **{f"{prefix}__content_type__app_label": app_label},
        **{f"{prefix}__codename": codename},
    )


def perm_filter(app_label: str, codename: str, *, prefix: str = "permission_groups__group__permissions") -> Q:
    """Public alias for ``_perm_q`` — Q for a single permission."""
    return _perm_q(app_label, codename, prefix=prefix)


def get_current_organization(info: Info) -> str:
    """Return the organization ID from the current request context.

    Reads ``request.organization_id``, which is set by
    ``OrganizationMiddleware`` from the ``X-Organization-ID`` header.

    Companion to ``get_current_user(info)`` — use it anywhere a schema
    method needs the active organization for selector/service calls.

    Raises:
        ``AttributeError`` if the request does not have ``organization_id``
        set.  This only happens when a field/mutation uses ``@HasOrgPerm``
        without the middleware being installed — which is a configuration
        error.
    """
    return str(info.context.request.organization_id)


_T = TypeVar("_T", bound=Model)


def _org_perm_exists_across_fields(
    user: AbstractBaseUser,
    app_label: str,
    codename: str,
    fields: list[str],
) -> Q:
    """Return a ``Q`` checking the user holds a permission on any of the org fields."""
    return reduce(
        or_,
        (
            Q(
                Exists(
                    Organization.objects.filter(pk=OuterRef(f))
                    .filter(permission_groups__group__user=user)
                    .filter(_perm_q(app_label, codename))
                )
            )
            for f in fields
        ),
    )


def permissioned_queryset(
    queryset: "QuerySet[_T]",
    *,
    user: AbstractBaseUser,
    organization_id: str,
    perms: Sequence[str] | None = None,
    any_perm: bool = True,
    organization_field: str = "organization_id",
    organization_fields: list[str] | None = None,
) -> "QuerySet[_T]":
    """Scope *queryset* to records in *organization_id* where *user* belongs to the org.

    When *perms* is provided, further restricts to records where the
    user holds the specified permission(s).  The org-membership check is
    implicit — ``permission_groups__group__user`` proves both.

    Parameters
    ----------
    queryset : QuerySet
        The base queryset to filter (e.g. ``Shelter.objects.all()``).
    user : User
        The authenticated user.
    organization_id : str
        The active organization ID.
    perms : Sequence[str] | None
        Optional permission(s) in ``"app_label.codename"`` format.
        If ``None``, only org membership is checked.
    any_perm : bool
        If ``True`` (default), user must hold at least one permission.
        If ``False``, user must hold **all** permissions.  Ignored
        when *perms* is ``None``.
    organization_field : str
        The Django field lookup path to the owning organization.
        Default ``"organization_id"`` works for models with a direct FK.
        Use ``"shelter__organization_id"`` for indirect (Bed, Room).
        Ignored when *organization_fields* is provided.
    organization_fields : list[str] | None
        Multiple field paths (OR'd together). Use when a model reaches
        its organization through more than one path (e.g. Reservation
        via ``bed__shelter__organization_id`` or
        ``room__shelter__organization_id``). Takes precedence over
        *organization_field*. Default ``None``.

    Returns
    -------
    QuerySet
        The filtered queryset.
    """
    fields = organization_fields or [organization_field]

    queryset = queryset.filter(reduce(or_, (Q(**{f: organization_id}) for f in fields)))

    if perms is None:
        queryset = queryset.filter(
            reduce(or_, (Q(Exists(Organization.objects.filter(pk=OuterRef(f), users=user))) for f in fields))
        )
    elif any_perm:
        q = Q()
        for perm_str in perms:
            app_label, codename = perm_str.split(".", 1)
            q |= _org_perm_exists_across_fields(user, app_label, codename, fields)
        queryset = queryset.filter(q)
    else:
        for perm_str in perms:
            app_label, codename = perm_str.split(".", 1)
            queryset = queryset.filter(_org_perm_exists_across_fields(user, app_label, codename, fields))

    return queryset


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
