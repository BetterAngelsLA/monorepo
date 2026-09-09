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

    Each codename binds to a ContentType, in preference order:

    1. an existing Permission row bound to a **real** model's ContentType;
    2. the model in *app_label* that **declares** the codename in its
       ``Meta.permissions`` (custom codenames like ``reports.view_reports`` on
       ``ScheduledReport``) — resolved from the app registry so provisioning
       never depends on ``create_permissions`` having run for that app yet
       (``post_migrate`` fires per-app, and roles are synced from the accounts
       handler);
    3. a ContentType synthesized from the codename's last ``_`` token — the
       member-management portal codenames (``organizations.add_org_member``,
       …), which no model declares, keep this fallback for legacy provisioning.

    Binding a scoped ``Role`` permission to a real model (1–2) is what lets it
    past ``sync_roles``' phantom-ContentType guard
    (``_raise_on_phantom_role_permissions``).
    """
    from django.apps import apps as django_apps

    parsed = [(ps.split(".", 1)[0], ps.split(".", 1)[1]) for ps in permission_strings]
    app_labels = {a for a, _ in parsed}
    codenames = {c for _, c in parsed}

    # (1) Existing Permission rows bound to a real model's ContentType.
    ct_by_key: dict[tuple[str, str], ContentType] = {}
    for perm in Permission.objects.filter(
        content_type__app_label__in=app_labels, codename__in=codenames
    ).select_related("content_type"):
        if perm.content_type.model_class() is not None:
            ct_by_key.setdefault((perm.content_type.app_label, perm.codename), perm.content_type)

    # (2) The model that declares the codename in Meta.permissions.
    for app_label in app_labels:
        try:
            app_models = django_apps.get_app_config(app_label).get_models()
        except LookupError:
            app_models = ()
        for model in app_models:
            for codename, _label in getattr(model._meta, "permissions", ()):
                if codename in codenames:
                    ct_by_key.setdefault((app_label, codename), ContentType.objects.get_for_model(model))

    # (3) Fallback: synthesize a ContentType from the codename's last ``_``
    # token for the codenames no real model declares (member-management).
    missing = [(a, c) for a, c in parsed if (a, c) not in ct_by_key]
    if missing:
        # ``missing`` items are (app_label, codename) pairs — index, don't
        # unpack, so the key stays the full pair.
        model_of = {pair: pair[1].rsplit("_", 1)[-1] for pair in missing}
        ContentType.objects.bulk_create(
            [ContentType(app_label=a, model=m) for (a, _c), m in model_of.items()],
            ignore_conflicts=True,
        )
        ct_lookup = {
            (ct.app_label, ct.model): ct
            for ct in ContentType.objects.filter(app_label__in=app_labels, model__in=set(model_of.values()))
        }
        for pair in missing:
            ct_by_key[pair] = ct_lookup[pair[0], model_of[pair]]

    # Ensure a Permission row exists bound to each resolved ContentType.
    existing = set(
        Permission.objects.filter(content_type__in=set(ct_by_key.values())).values_list(
            "content_type__app_label", "codename"
        )
    )
    Permission.objects.bulk_create(
        [
            Permission(codename=c, content_type=ct_by_key[(a, c)], name=c.replace("_", " ").title())
            for a, c in parsed
            if (a, c) not in existing
        ],
        ignore_conflicts=True,
    )

    # Re-read now that everything exists, preferring a real row when both a
    # synthesized and a real row exist for the same (app_label, codename).
    id_lookup: dict[tuple[str, str], int] = {}
    for perm in Permission.objects.filter(
        content_type__app_label__in=app_labels, codename__in=codenames
    ).select_related("content_type"):
        key = (perm.content_type.app_label, perm.codename)
        if key not in id_lookup or perm.content_type.model_class() is not None:
            id_lookup[key] = perm.pk
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

        permission_groups = PermissionGroup.objects.filter(template__isnull=False).prefetch_related("permissions")
        if organization is not None:
            permission_groups = permission_groups.filter(organization=organization)

        for permission_group in permission_groups:
            wanted = wanted_by_template.get(cast(int, permission_group.template_id), set())
            if {p.pk for p in permission_group.permissions.all()} != wanted:
                permission_group.permissions.set(wanted)
                logger.info("Synced permissions for group %s (%d perms)", permission_group.name, len(wanted))


def retire_superseded_phantom_permissions() -> None:
    """Delete phantom Permission rows superseded by a real model's row.

    ``_resolve_permissions`` used to synthesize a ContentType from a custom
    codename's last ``_`` token, so DBs seeded before real-model binding carry a
    phantom ``(reports, reports)`` ContentType + ``view_reports`` Permission row
    (roles/legacy groups may reference them).  Once a codename binds to a real
    model (e.g. ``reports.view_reports`` on ``ScheduledReport``), the phantom
    twin is dead weight — authority never consults it (lookups match
    app+codename against the real row), but it makes
    ``Permission.objects.get(app_label + codename)`` ambiguous and pollutes the
    Django admin.

    Deletes every phantom Permission (model-less ContentType) whose codename
    also exists on a real ContentType in the same app, then drops phantom
    ContentTypes left with no permissions.  Member-management portal codenames
    (``organizations.*``) have no real twin, so their phantom rows are kept —
    they are still the only rows those codenames live on.  Idempotent; runs at
    ``post_migrate`` once roles/groups have converged onto the real rows.
    """
    with transaction.atomic():
        phantom_cts = [ct for ct in ContentType.objects.all() if ct.model_class() is None]
        if not phantom_cts:
            return
        phantom_ct_ids = {ct.pk for ct in phantom_cts}

        phantom_perms = list(Permission.objects.filter(content_type_id__in=phantom_ct_ids))
        real_pairs = set(
            Permission.objects.exclude(content_type_id__in=phantom_ct_ids).values_list(
                "content_type__app_label", "codename"
            )
        )
        doomed = [p for p in phantom_perms if (p.content_type.app_label, p.codename) in real_pairs]
        if doomed:
            Permission.objects.filter(pk__in=[p.pk for p in doomed]).delete()
            logger.info("Retired %d phantom permissions superseded by real model rows", len(doomed))

        remaining = set(
            Permission.objects.filter(content_type_id__in=phantom_ct_ids).values_list("content_type_id", flat=True)
        )
        orphaned = [ct.pk for ct in phantom_cts if ct.pk not in remaining]
        if orphaned:
            ContentType.objects.filter(pk__in=orphaned).delete()
            logger.info("Retired %d phantom ContentTypes", len(orphaned))
