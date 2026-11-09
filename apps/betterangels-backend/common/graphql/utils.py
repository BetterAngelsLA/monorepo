from typing import TYPE_CHECKING, Any, TypeVar

from django.core.exceptions import PermissionDenied
from django.db.models import Model, QuerySet
from strawberry import UNSET

from common.utils import get_or_none

if TYPE_CHECKING:
    from organizations.models import Organization

    from accounts.models import PermissionGroup
    from common.permissions.config import TemplateConfig

T = TypeVar("T", bound=Model)

#: The refusal every org-scoped surface uses, so an unknown org and an unauthorized one
#: read identically to the caller.
ORG_PERMISSION_DENIED_MESSAGE = "You do not have access to this organization."


def org_or_deny(org_id: object) -> "Organization":
    """Resolve a client-supplied organization id, failing closed.

    A missing, unknown, or malformed id (``""``, a UUID string, ``None``, or the
    ``strawberry.UNSET`` an omitted optional filter field carries) is a permission
    problem — ``PermissionDenied`` — never a ``DoesNotExist`` crash or a ``ValueError``.
    ``get_or_none`` is the house guard for exactly that (``common.utils``).

    **Existence only.** It deliberately does not check authority: callers pair it with
    ``require_can``/``can`` at the resolved org (ADR 0001 §2.6, finding F7 — ``can`` never
    implies the organization exists, so the two checks are separate and both required).

    Lives here so the four org-scoped schema modules (``accounts``, ``reports``,
    ``regions``, ``teams``) share one refusal instead of four that can drift apart.
    Module-level rather than a method: strawberry-django resolvers are invoked unbound.
    """
    # An omitted optional filter field carries ``strawberry.UNSET``, not ``None``:
    # it names no org, so deny before the lookup.
    if org_id is UNSET:
        raise PermissionDenied(ORG_PERMISSION_DENIED_MESSAGE)

    from organizations.models import Organization

    org = get_or_none(Organization.objects.all(), org_id)
    if org is None:
        raise PermissionDenied(ORG_PERMISSION_DENIED_MESSAGE)
    return org


def resolve_create_org(
    user: Any,
    organization_id: object,
    *,
    template: "TemplateConfig",
    perm: str,
) -> "tuple[Organization, PermissionGroup | None]":
    """Resolve the org a create acts at, plus the legacy group during a compat window.

    Both create gates (RFC 0002/0003) take the acting org from the payload:

    * **Payload org present** — ``org_or_deny`` resolves it (missing, unknown and
      malformed ids deny alike) and ``require_can`` gates *perm* at it.  Returns
      ``(organization, None)``.
    * **Payload org absent** — a build that predates the field still creates
      through its legacy ``template`` group, so the org comes from the group
      exactly as before the cutover.  Returns ``(organization, group)`` and the
      caller takes the legacy service path while the group is not ``None``.

    ``resolve_permission_group`` raises the builtin ``PermissionError``, which
    the mutation wrapper does not translate; converting it here is what keeps a
    pre-wiring build on the ``OperationInfo`` payload it knows how to read
    instead of ``data: null`` plus an internal message.

    Lives here rather than in a selector because it refuses (styleguide:
    "selectors answer, utils refuse").
    """
    from accounts.selectors import resolve_permission_group
    from common.permissions.utils import PERMISSION_DENIED_MESSAGE, require_can

    if organization_id is not None and organization_id is not UNSET:
        organization = org_or_deny(organization_id)
        require_can(user, perm, org=organization)
        return organization, None

    try:
        permission_group = resolve_permission_group(user, template=template)
    except PermissionError as exc:
        raise PermissionDenied(PERMISSION_DENIED_MESSAGE) from exc
    # The legacy arm, deliberately: a build in a compat window has no payload
    # org, so it is authorized exactly as it was before the cutover — group
    # membership plus the model permission the group must carry.  The
    # domain-authority paths use the grant selectors instead.
    if not user.has_perm(perm):
        raise PermissionDenied(PERMISSION_DENIED_MESSAGE)
    return permission_group.organization, permission_group


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
    obj = get_or_none(qs, pk)

    if obj is None:
        raise PermissionDenied(error_message)

    return obj
