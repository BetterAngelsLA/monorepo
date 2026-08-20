from typing import Any, TypeVar, cast

from strawberry import ID, Maybe
from strawberry.types import Info
from strawberry_django.auth.utils import get_current_user

from accounts.models import PermissionGroup, User
from accounts.selectors import permission_group_for_user
from common.permissions.config import TemplateConfig
from common.permissions.utils import get_current_organization
from organizations.models import Organization
from django.core.exceptions import ImproperlyConfigured, ObjectDoesNotExist, PermissionDenied
from django.db.models import Model, QuerySet

T = TypeVar("T", bound=Model)


def active_organization(info: Info) -> Organization:
    """Return the ``Organization`` the active-org header names."""
    return Organization.objects.get(pk=get_current_organization(info))


def permission_group_for_request(info: Info, *, template: TemplateConfig) -> PermissionGroup:
    """Return the caller's *template* permission group in the active organization."""
    return permission_group_for_user(
        user=cast(User, get_current_user(info)),
        org_id=get_current_organization(info),
        template_name=template.name,
    )


def permissioned_qs(info: Info, model: type[T]) -> QuerySet[T]:
    """Return the queryset ``PermissionedQuerySet`` prepared for this resolver."""
    qs = info.context.qs

    if qs.model is not model:
        raise ImproperlyConfigured(
            f"PermissionedQuerySet is configured for {qs.model.__name__}, but the resolver expects {model.__name__}."
        )

    return cast(QuerySet[T], qs)


def get_object_or_permission_error(
    qs: QuerySet[T],
    pk: Any,
    error_message: str = "You do not have permission to perform this action.",
) -> T:
    """
    Get an object from a permission-filtered QuerySet or raise PermissionDenied.

    This helper standardizes the pattern required by PermissionedQuerySet:
    since the queryset is already filtered by row-level permissions,
    a DoesNotExist exception usually implies a permission denial (even if
    technically it could be a 404). Cross-org protection relies on this explicit error.
    """
    try:
        return qs.get(pk=pk)
    except ObjectDoesNotExist:
        raise PermissionDenied(error_message)


def maybe_int_value(maybe: Maybe[ID | None]) -> int | None:
    """Narrow a ``Maybe[ID | None]`` to the FK's int, collapsing absent and null.

    Callers assigning the result into a dict of fields to update need a presence
    check on the input field first, or an absent field becomes an explicit null.
    """
    if maybe is None or maybe.value is None:
        return None

    return int(maybe.value)
