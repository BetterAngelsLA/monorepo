"""Access-class resolution for scoped models (ADR 0004).

The *declaration slot* lives on the model layer (``common.models``: ``Access``
and the ``ACCESS_*`` / ``WRITE_*`` values); this module resolves what a
permission on a model *means* for its declared classes.  One place answers that
question for every consumer — the selectors, the deploy-time checks and the
grant admittance rule — so they cannot drift apart.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Iterable, Iterator, Optional

if TYPE_CHECKING:
    from django.contrib.auth.models import Permission
    from django.db.models import Model


def access_class_for(model: "type[Model]", perm: str) -> Optional[str]:
    """The declared authority class for *perm* on *model* (ADR 0004).

    Reads resolve through ``Access.read``; everything else through
    ``Access.write`` — the split follows Django's codename convention.
    """
    from common.models import Access

    access: Optional[Access] = getattr(model, "access", None)
    if access is None:
        return None
    codename = perm.rsplit(".", 1)[-1]
    return access.read if codename.startswith("view_") else access.write


def is_global_class(model: "type[Model]", perm: str) -> bool:
    """Whether *perm* on *model* resolves to a declared GLOBAL class (ADR 0004).

    The predicate behind the selectors' declaration branch and the admittance
    rule (``permissions.E008`` / ``Grant.clean``): GLOBAL-class abilities
    answer at the global tier only, so no scoped Grant can ever exercise them.
    """
    from common.models import ACCESS_GLOBAL, WRITE_GLOBAL

    return access_class_for(model, perm) in (ACCESS_GLOBAL, WRITE_GLOBAL)


def global_class_abilities(permissions: Iterable["Permission"]) -> Iterator[tuple["Permission", "type[Model]"]]:
    """Yield ``(permission, model)`` pairs whose declared class is GLOBAL.

    The single scan shared by the admittance rule (``Grant.clean``) and its
    deploy-time backstop (``permissions.E008``) — the rule lives in one place;
    the two writers duplicate only the call (styleguide: "duplicate the call,
    never the rule").
    """
    for permission in permissions:
        model = permission.content_type.model_class()
        if model is None or model._meta.abstract:
            continue
        if is_global_class(model, permission.codename):
            yield permission, model
