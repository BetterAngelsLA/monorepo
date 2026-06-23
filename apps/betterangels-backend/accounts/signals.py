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
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(username="admin", email="admin@example.com", password="password")


@receiver(post_migrate)
def create_test_agent(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="agent").exists():
        User.objects.create_user(
            username="agent",
            email="agent@example.com",
            password="password",
            first_name="Carolyn",
        )


@receiver(post_migrate)
def create_test_organization(sender: Any, **kwargs: Any) -> None:
    if not settings.IS_LOCAL_DEV or Organization.objects.filter(name="test_org").exists():
        return

    from accounts.groups import ORG_ADMIN
    from accounts.services import create_organization_with_presets, member_add
    from shelters.groups import SHELTER_OPERATOR

    admin = User.objects.get(username="admin")
    agent = User.objects.get(username="agent")

    # Create the org with shelter preset — this also creates PermissionGroups.
    test_org = create_organization_with_presets(
        name="test_org",
        preset_names=["shelter"],
        owner=admin,
        owner_roles=(ORG_ADMIN,),
    )

    # Agent gets the shelter member role.
    member_add(
        email=agent.email,
        first_name=agent.first_name or "",
        last_name=agent.last_name or "",
        middle_name=None,
        organization=test_org,
        permission_templates=(SHELTER_OPERATOR,),
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
