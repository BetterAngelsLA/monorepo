"""Seed and sync of permission data, driven from :data:`common.org_types.REGISTRY`.

Replaces RunPython data migrations. Called by:

* ``post_migrate`` signal (production & local dev)
* ``manage.py seed_data`` management command (manual)

Uses ``get_or_create`` throughout — idempotent, safe to re-run.

A role's permission set lives in its
:class:`~common.permissions.config.TemplateConfig` when the code defines the role,
and on the ``PermissionGroupTemplate`` row itself when someone defined it in the
admin.  Either way it is written onto the ``auth.Group`` that actually grants it.
"""

from logging import getLogger
from typing import cast

from common.org_types import REGISTRY
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from organizations.models import Organization

from accounts.models import PermissionGroup, PermissionGroupTemplate

logger = getLogger(__name__)


def _resolve_permissions(permission_strings: list[str]) -> list[int]:
    """Resolve ``'app_label.codename'`` strings to Permission primary keys.

    Uses ``ignore_conflicts=True`` so that existing rows are a no-op.
    Returns IDs in the same order as *permission_strings* so callers
    can compare against existing sets.  No Permission objects are
    instantiated — pure ID-based.
    """
    parsed = [(ps.split(".", 1)[0], ps.split(".", 1)[1]) for ps in permission_strings]
    app_labels = {a for a, _ in parsed}
    codenames = {c for _, c in parsed}
    model_of: dict[tuple[str, str], str] = {(a, c): c.rsplit("_", 1)[-1] for a, c in parsed}

    ContentType.objects.bulk_create(
        [ContentType(app_label=a, model=m) for a, m in {(a, model_of[(a, c)]) for a, c in parsed}],
        ignore_conflicts=True,
    )

    ct_lookup = {
        (ct.app_label, ct.model): ct
        for ct in ContentType.objects.filter(app_label__in=app_labels, model__in=set(model_of.values()))
    }

    Permission.objects.bulk_create(
        [
            Permission(codename=c, content_type=ct_lookup[(a, model_of[(a, c)])], name=c.replace("_", " ").title())
            for a, c in parsed
        ],
        ignore_conflicts=True,
    )

    id_lookup: dict[tuple[str, str], int] = {
        (a, c): pk
        for a, c, pk in Permission.objects.filter(
            content_type__app_label__in=app_labels, codename__in=codenames
        ).values_list("content_type__app_label", "codename", "pk")
    }
    return [id_lookup[(a, c)] for a, c in parsed]


def seed_permission_templates() -> None:
    """Ensure a ``PermissionGroupTemplate`` row exists for every registered role.

    Idempotent — safe to call on every ``migrate`` / test session start.
    Permissions are not stored here; see :func:`sync_group_permissions`.
    """
    for name in REGISTRY.template_names():
        _, created = PermissionGroupTemplate.objects.get_or_create(name=name)
        if created:
            logger.info("Created PermissionGroupTemplate: %s", name)


def sync_group_permissions(*, organization: Organization | None = None) -> None:
    """Apply each role's permissions to the ``auth.Group`` that grants them.

    A role's permissions come from its template, resolved by tier:

    * **Managed** — the template is named in :data:`common.org_types.REGISTRY`, so its
      ``TemplateConfig`` is authoritative and the template's own ``permissions`` are
      refreshed to match.  This is what picks up a permission change in code on the
      next ``migrate``.
    * **Hand-defined** — the template was created in the admin and the code knows
      nothing about it, so its ``permissions`` *are* the definition and are read, not
      written.  This is what lets one admin-defined role reach every organization
      holding it.

    Pass *organization* to scope the sync to one org, which is how a newly created
    group gets its permissions without waiting for the next ``migrate``.
    """
    configured: dict[str, set[int]] = {}
    for name in REGISTRY.template_names():
        template_config = REGISTRY.template(name)
        if template_config is None:
            continue
        configured[name] = set(_resolve_permissions(template_config.permissions))

    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.prefetch_related("permissions")
        wanted_by_template: dict[int, set[int]] = {}
        for template in templates:
            wanted = configured.get(template.name)
            if wanted is None:
                # Hand-defined: the template row is the definition.
                wanted_by_template[template.pk] = {p.pk for p in template.permissions.all()}
                continue
            wanted_by_template[template.pk] = wanted
            if {p.pk for p in template.permissions.all()} != wanted:
                template.permissions.set(wanted)

        permission_groups = PermissionGroup.objects.filter(template__isnull=False).prefetch_related(
            "group__permissions"
        )
        if organization is not None:
            permission_groups = permission_groups.filter(organization=organization)

        for permission_group in permission_groups:
            wanted = wanted_by_template.get(cast(int, permission_group.template_id), set())
            if {p.pk for p in permission_group.group.permissions.all()} != wanted:
                permission_group.group.permissions.set(wanted)
                logger.info("Synced permissions for group %s (%d perms)", permission_group.group.name, len(wanted))
