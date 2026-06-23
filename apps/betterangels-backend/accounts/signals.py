import logging
from typing import Any

from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from organizations.models import Organization

from .models import PermissionGroup, PermissionGroupTemplate, User

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
    if settings.IS_LOCAL_DEV and not Organization.objects.filter(name="test_org").exists():
        test_usernames = ["admin", "agent"]
        test_users = User.objects.filter(username__in=test_usernames)
        test_org = Organization.objects.create(name="test_org")
        for test_user in test_users:
            test_org.add_user(test_user)

        # Create permission groups for the test org based on its type (shelter).
        _setup_test_org_groups(test_org, test_users)


def _setup_test_org_groups(org: Organization, users: list[User]) -> None:
    """Create PermissionGroup records for a shelter-type org and assign users."""
    # Templates appropriate for a shelter organization.
    shelter_templates = ["Organization Admin", "Shelter Operator"]

    admin_user = next((u for u in users if u.username == "admin"), None)

    for template_name in shelter_templates:
        template = PermissionGroupTemplate.objects.get(name=template_name)
        pg, _ = PermissionGroup.objects.get_or_create(
            organization=org,
            name=template_name,
            defaults={"template": template},
        )
        # Admin gets all shelter templates; agent only gets what was
        # explicitly assigned elsewhere (handled by registration flow).
        if admin_user:
            admin_user.groups.add(pg.group)


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
