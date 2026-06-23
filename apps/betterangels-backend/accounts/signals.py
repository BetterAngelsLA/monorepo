import logging
from typing import Any

from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from organizations.models import Organization

from .models import PermissionGroupTemplate, User

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV:
        User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@example.com", "password": "password"},
        )
        # Ensure superuser flags even on existing record.
        User.objects.filter(username="admin").update(is_superuser=True, is_staff=True)
        # Set password in case it changed (get_or_create won't overwrite).
        if (admin := User.objects.filter(username="admin").first()) and not admin.check_password("password"):
            admin.set_password("password")
            admin.save(update_fields=["password"])


@receiver(post_migrate)
def create_test_agent(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV:
        User.objects.get_or_create(
            username="agent",
            defaults={
                "email": "agent@example.com",
                "password": "password",
                "first_name": "Carolyn",
            },
        )
        # Ensure password is correct even on existing record.
        if (agent := User.objects.filter(username="agent").first()) and not agent.check_password("password"):
            agent.set_password("password")
            agent.save(update_fields=["password"])


@receiver(post_migrate)
def create_test_organization(sender: Any, **kwargs: Any) -> None:
    """Ensure ``test_org`` exists with the expected users, roles, and groups.

    Fully idempotent — uses ``get_or_create`` for the org and always syncs
    groups from the current presets so new templates are picked up.
    """
    if not settings.IS_LOCAL_DEV:
        return

    from accounts.groups import ORG_ADMIN
    from accounts.services import member_add
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    admin = User.objects.get(username="admin")
    agent = User.objects.get(username="agent")

    # Create the org and sync groups from current presets.
    test_org, _ = Organization.objects.get_or_create(name="test_org")

    # Ensure owner is linked.
    if not test_org.owners.filter(organization_user__user=admin).exists():
        test_org.add_user(admin)

    # Role assignments (idempotent — skips already-assigned templates).
    member_add(
        email=admin.email or "admin@example.com",
        first_name="Admin",
        last_name="User",
        middle_name=None,
        organization=test_org,
        permission_templates=(ORG_ADMIN, SHELTER_OPERATOR, CASEWORKER),
    )
    member_add(
        email=agent.email or "agent@example.com",
        first_name=agent.first_name or "",
        last_name=agent.last_name or "",
        middle_name=None,
        organization=test_org,
        permission_templates=(SHELTER_OPERATOR, CASEWORKER),
    )


@receiver(post_migrate)
def update_group_permissions(sender: Any, **kwargs: Any) -> None:
    """Create missing PermissionGroups and sync permissions for all templates.

    Iterates every registered org-type preset and creates any
    ``PermissionGroup`` records that don't exist yet (``get_or_create``),
    then syncs the Django ``Group.permissions`` for all existing groups.

    This means adding a new template to a preset automatically propagates
    to every org on the next ``post_migrate`` — no migration needed.
    """
    from common.org_types import REGISTRY

    from .models import PermissionGroup

    # 1. Ensure every org has a PermissionGroup for every template in its presets.
    for org in Organization.objects.all():
        org_type_values = org.profile.org_types if hasattr(org, "profile") else []
        for org_type_value in org_type_values:
            org_config = REGISTRY.org_type(org_type_value.value)
            if org_config is None:
                continue
            for template_config in org_config.templates:
                permission_group_template, _ = PermissionGroupTemplate.objects.get_or_create(
                    name=template_config.name,
                )
                PermissionGroup.objects.get_or_create(
                    organization=org,
                    template=permission_group_template,
                )

    # 2. Sync the Django Group permissions for every existing group.
    template_names = REGISTRY.template_names()

    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.filter(name__in=template_names).prefetch_related(
            "permissions", "permissiongroup_set__group"
        )

        for template in templates:
            perms = list(template.permissions.all())
            for pgt in template.permissiongroup_set.all():
                pgt.group.permissions.set(perms)
