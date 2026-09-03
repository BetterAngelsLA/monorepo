"""System checks for the grant-based authorization model (ADR 0001).

IDs: ``permissions.E001``–``permissions.E006``.

The data-reading checks return ``[]`` on any ``DatabaseError`` — unreachable
database, or tables not migrated yet — so ``manage.py check``, ``makemigrations``
and every command that runs checks keeps working before the first ``migrate``.
The checks are deploy-time guards, not gatekeepers: if the data can't be read,
there is nothing to guard.
"""

from __future__ import annotations

from typing import Any

from django.core.checks import Error, Tags, register


@register(Tags.models)
def check_scoped_role_never_in_user_groups(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E001 — a scoped Role must never sit in a user's groups.

    A Role with ``is_global=False`` grants authority through a Grant row.  Adding
    it to ``user.groups`` instead would silently make it global — the "helpful
    fix" attack.
    """
    from django.apps import apps
    from django.db.utils import DatabaseError

    try:
        User = apps.get_model("accounts", "User")

        errors: list[Error] = []
        for user in User.objects.filter(groups__role__is_global=False).distinct():
            scoped_roles = list(user.groups.filter(role__is_global=False).values_list("name", flat=True))
            errors.append(
                Error(
                    f"User {user} holds scoped Role(s) {scoped_roles} directly in groups, which makes them global.",
                    hint="Scoped roles are granted through a Grant row, never through user.groups.",
                    obj=user,
                    id="permissions.E001",
                )
            )
        return errors
    except DatabaseError:
        return []


@register(Tags.models)
def check_grant_never_references_global_role(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E002 — a Grant must never reference a global Role."""
    from django.apps import apps
    from django.db.utils import DatabaseError

    try:
        Grant = apps.get_model("accounts", "Grant")

        errors: list[Error] = []
        for grant in Grant.objects.filter(role__is_global=True).select_related("role"):
            errors.append(
                Error(
                    f"Grant {grant} references global Role {grant.role.name!r}.",
                    hint="Global roles are held directly in user.groups; they are never granted through a Grant.",
                    obj=grant,
                    id="permissions.E002",
                )
            )
        return errors
    except DatabaseError:
        return []


@register(Tags.models)
def check_object_grant_targets_whitelisted_model(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E003 — object grants may only target whitelisted, non-org-bearing models.

    The whitelist (``common.permissions.config.OBJECT_GRANT_WHITELIST``) is empty
    until the object-grant arm is wired (ADR 0001 §2.5): object grants are
    schema-live but must not be written before then, and org-bearing models are
    never object-grantable (that would duplicate org scope).  ``Grant.clean``
    shares the same whitelist, so the write-time and deploy-time gates open
    together.
    """
    from common.permissions.config import OBJECT_GRANT_WHITELIST, content_type_key
    from django.apps import apps
    from django.db.utils import DatabaseError

    try:
        Grant = apps.get_model("accounts", "Grant")

        errors: list[Error] = []
        for grant in Grant.objects.filter(scope_object_type__isnull=False).select_related("scope_object_type"):
            if content_type_key(grant.scope_object_type) in OBJECT_GRANT_WHITELIST:
                continue
            errors.append(
                Error(
                    f"Grant {grant} is an object grant on {grant.scope_object_type}, "
                    "which is not on the object-grant whitelist.",
                    hint="Object grants are not wired yet (ADR 0001 §2.5); no model is object-grantable.",
                    obj=grant,
                    id="permissions.E003",
                )
            )
        return errors
    except DatabaseError:
        return []


def _org_via_errors_for_model(model: Any) -> list[Error]:
    """E004 errors for one ``OrgScoped`` model — extracted for direct testing."""
    errors: list[Error] = []
    for name in model.org_via or ():
        field = model._meta.get_field(name)
        if not (field.many_to_one or field.one_to_one):
            errors.append(
                Error(
                    f"{model.__name__}.org_via names {name!r}, which is multi-valued; "
                    "the scope filter would duplicate rows.",
                    hint="org_via hops must be single-valued (FK or OneToOne) relations.",
                    obj=model,
                    id="permissions.E004",
                )
            )
    return errors


@register(Tags.models)
def check_org_via_hops_are_single_valued(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E004 — OrgScoped.org_via hops must be single-valued.

    A reverse-FK or M2M hop in an org path would duplicate rows in the scope
    filter (the bug class recorded at notes/types.py).  Runs without a database.
    """
    from common.models import OrgScoped
    from django.apps import apps

    errors: list[Error] = []
    for model in apps.get_models():
        if model._meta.abstract or not issubclass(model, OrgScoped):
            continue
        errors.extend(_org_via_errors_for_model(model))
    return errors


@register(Tags.models)
def check_role_permissions_models_declare_org_scoping(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E005 — every model a *scoped* Role grants a permission on must declare OrgScoped.

    A scoped Role's permission is exercised through the org filter, so the model
    must declare how it reaches an organization — or declare itself platform-shared
    via ``org_via = None``.  Global Roles are exempt: their permissions are never
    org-confined, so no declaration is required until a scoped Role holds them.
    """
    from common.models import OrgScoped
    from django.apps import apps
    from django.db.utils import DatabaseError

    try:
        Role = apps.get_model("accounts", "Role")

        errors: list[Error] = []
        for role in Role.objects.filter(is_global=False).prefetch_related("permissions__content_type"):
            for permission in role.permissions.all():
                model = permission.content_type.model_class()
                if model is None or model._meta.abstract:
                    continue
                if not issubclass(model, OrgScoped):
                    errors.append(
                        Error(
                            f"Role {role.name!r} grants {permission.codename} on {model.__name__}, "
                            "which does not declare org scoping.",
                            hint="Add OrgScoped to the model and set org_via (or org_via = None for "
                            "platform-shared data).",
                            obj=model,
                            id="permissions.E005",
                        )
                    )
        return errors
    except DatabaseError:
        return []


@register(Tags.models)
def check_object_grant_principal_is_a_user(app_configs: Any, **kwargs: Any) -> list[Error]:
    """E006 — an object grant's principal must be a user, never an organization.

    Org-principal object grants are forbidden (ADR 0001 §2.5): per-record
    authority attaches to a person you can audit and revoke, and an org-principal
    row would make it org-granular — "every current *and future* member of this
    org with this role edits this record" — the guardian shape this model
    deletes.  ``Grant.clean`` refuses it at write time; this is the deploy-time
    backstop for writers that skip ``clean()``.
    """
    from django.apps import apps
    from django.db.utils import DatabaseError

    try:
        Grant = apps.get_model("accounts", "Grant")

        errors: list[Error] = []
        for grant in Grant.objects.filter(principal_org__isnull=False, scope_object_type__isnull=False).select_related(
            "principal_org", "scope_object_type"
        ):
            errors.append(
                Error(
                    f"Grant {grant} grants an object to organization {grant.principal_org!r}.",
                    hint="Object grants are user-principal only (ADR 0001 §2.5): share records "
                    "person-to-person, never to an organization.",
                    obj=grant,
                    id="permissions.E006",
                )
            )
        return errors
    except DatabaseError:
        return []
