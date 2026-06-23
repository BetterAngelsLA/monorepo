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

    Fully idempotent — safe to run on every ``post_migrate`` regardless of
    whether the data already exists.  Uses ``get_or_create`` for the org
    and ``member_add`` (which skips already-assigned templates).
    """
    if not settings.IS_LOCAL_DEV:
        return

    from accounts.groups import ORG_ADMIN
    from accounts.services import create_organization_with_presets, member_add
    from notes.groups import CASEWORKER
    from shelters.groups import SHELTER_OPERATOR

    admin = User.objects.get(username="admin")
    agent = User.objects.get(username="agent")

    # Create the org if it doesn't exist; skip preset group creation if it does.
    test_org, created = Organization.objects.get_or_create(name="test_org")

    if created:
        test_org = create_organization_with_presets(
            name="test_org",
            preset_names=["shelter", "outreach"],
            owner=admin,
            owner_roles=(ORG_ADMIN, SHELTER_OPERATOR, CASEWORKER),
        )
    else:
        # Org already exists — ensure owner is still linked.
        if not test_org.owners.filter(organization_user__user=admin).exists():
            test_org.add_user(admin)

    # Role assignments are idempotent: member_add only grants templates
    # the user doesn't already hold.
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
    """Sync Django Group permissions for all registered templates.

    Uses :meth:`Registry.template_names` so that new org types and roles
    are automatically included -- no need to manually update a hardcoded
    list.
    """
    from common.org_types import REGISTRY

    template_names = REGISTRY.template_names()

    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.filter(name__in=template_names).prefetch_related(
            "permissions", "permissiongroup_set__group"
        )

        for template in templates:
            perms = list(template.permissions.all())
            for pgt in template.permissiongroup_set.all():
                pgt.group.permissions.set(perms)
