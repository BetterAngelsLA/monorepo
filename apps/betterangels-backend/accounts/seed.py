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


def _resolve_permissions(
    permission_strings: list[str],
) -> list[Permission]:
    """Resolve ``'app_label.codename'`` strings to Permission objects.

    Creates missing Permission / ContentType rows in the process, so this
    works both with and without ``--no-migrations``.
    """
    resolved: list[Permission] = []
    for perm_str in permission_strings:
        app_label, codename = perm_str.split(".", 1)
        # Infer model name from codename: "view_shelter" → "shelter"
        model_name = codename.rsplit("_", 1)[-1]
        ct, _ = ContentType.objects.get_or_create(
            app_label=app_label,
            model=model_name,
        )
        perm, _ = Permission.objects.get_or_create(
            codename=codename,
            content_type=ct,
            defaults={"name": codename.replace("_", " ").title()},
        )
        resolved.append(perm)
    return resolved


def _seed_template(template_config: TemplateConfig) -> None:
    """Create or update a PermissionGroupTemplate with its configured permissions."""
    name = template_config.name
    permissions = template_config.permissions

    template, created = PermissionGroupTemplate.objects.get_or_create(name=name)
    if created:
        logger.info("Created PermissionGroupTemplate: %s", name)

    perm_objects = _resolve_permissions(permissions)
    existing = set(template.permissions.values_list("id", flat=True))
    wanted = {p.pk for p in perm_objects}
    if existing != wanted:
        template.permissions.set(perm_objects)
        logger.info(
            "Updated PermissionGroupTemplate permissions: %s (%d perms)",
            name,
            len(perm_objects),
        )


def seed_permission_templates() -> None:
    """Ensure all PermissionGroupTemplates exist with correct permissions.

    Idempotent — safe to call on every ``migrate`` / test session start.
    """
    # Skip if already seeded — avoids individual permission resolution queries.
    expected_names = {t.name for t in ALL_TEMPLATES}
    existing_names = set(PermissionGroupTemplate.objects.filter(name__in=expected_names).values_list("name", flat=True))
    if existing_names == expected_names:
        return

    for template_config in ALL_TEMPLATES:
        _seed_template(template_config)
