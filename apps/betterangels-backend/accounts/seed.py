"""Seed data for PermissionGroupTemplates.

Replaces RunPython data migrations. Called by:

* ``post_migrate`` signal (production & local dev)
* ``conftest.py`` session fixture (CI / ``--no-migrations``)
* ``manage.py seed_data`` management command (manual)

Uses ``get_or_create`` throughout — idempotent, safe to re-run.
"""

from logging import getLogger

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import PermissionGroupTemplate
from common.permissions.config import TemplateConfig
from notes.groups import CASEWORKER
from shelters.groups import GLOBAL_SHELTER_OPERATOR, SHELTER_OPERATOR

logger = getLogger(__name__)

ALL_TEMPLATES = (CASEWORKER, ORG_ADMIN, ORG_SUPERUSER, GLOBAL_SHELTER_OPERATOR, SHELTER_OPERATOR)


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


def _seed_template(template_config: TemplateConfig) -> None:
    """Create or update a PermissionGroupTemplate with its configured permissions."""
    name = template_config.name

    template, created = PermissionGroupTemplate.objects.get_or_create(name=name)
    if created:
        logger.info("Created PermissionGroupTemplate: %s", name)

    wanted_ids = _resolve_permissions(template_config.permissions)
    existing_ids = set(template.permissions.values_list("id", flat=True))
    if set(wanted_ids) != existing_ids:
        template.permissions.set(wanted_ids)
        logger.info("Updated PermissionGroupTemplate permissions: %s (%d perms)", name, len(wanted_ids))


def seed_permission_templates() -> None:
    """Ensure all PermissionGroupTemplates exist with correct permissions.

    Idempotent — safe to call on every ``migrate`` / test session start.
    Always iterates through every template so that permissions are
    re-synced when a data migration creates a template without
    permissions (e.g. the consolidation migration that moves users
    into ``Global Shelter Operator``).  ``_seed_template`` is itself
    idempotent and only issues writes when the permission set differs.
    """
    for template_config in ALL_TEMPLATES:
        _seed_template(template_config)
