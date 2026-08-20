"""Seed and sync of permission data, driven from :data:`common.org_types.REGISTRY`.

Replaces RunPython data migrations. Called by:

* ``post_migrate`` signal (production & local dev)
* ``manage.py seed_data`` management command (manual)

Uses ``get_or_create`` throughout — idempotent, safe to re-run.

``PermissionGroupTemplate`` is a name only: the permission set for a role lives
in its :class:`~common.permissions.config.TemplateConfig` and is written
straight onto the ``auth.Group`` that actually grants it.
"""

from logging import getLogger

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
    """Reconcile ``PermissionGroup`` rows' ``auth.Group`` permissions against config.

    The config in :data:`common.org_types.REGISTRY` is the only source of truth
    for which permissions a role carries, so this is what picks up a permission
    change on the next ``migrate``.  Groups whose template is not registered are
    left alone — they are managed by hand.

    Pass *organization* to scope the sync to one org, which is how a newly
    created group gets its permissions without waiting for the next ``migrate``.
    """
    wanted_by_template: dict[str, set[int]] = {}
    for name in REGISTRY.template_names():
        template_config = REGISTRY.template(name)
        if template_config is None:
            continue
        wanted_by_template[name] = set(_resolve_permissions(template_config.permissions))

    with transaction.atomic():
        permission_groups = PermissionGroup.objects.filter(template__name__in=wanted_by_template).prefetch_related(
            "group__permissions"
        )
        if organization is not None:
            permission_groups = permission_groups.filter(organization=organization)

        for permission_group in permission_groups:
            template = permission_group.template
            assert template is not None
            wanted = wanted_by_template[template.name]
            if {p.pk for p in permission_group.group.permissions.all()} != wanted:
                permission_group.group.permissions.set(wanted)
                logger.info("Synced permissions for group %s (%d perms)", permission_group.group.name, len(wanted))
