import logging
from typing import Any

from accounts.utils import (
    add_default_org_permissions_to_user,
    remove_org_group_permissions_from_user,
    remove_organization_permission_group,
)
from django.conf import settings
from django.db.models.signals import post_delete, post_migrate, post_save, pre_delete
from django.dispatch import receiver
from organizations.models import Organization, OrganizationUser

from .models import PermissionGroupTemplate, User

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin", email="admin@ba.la", password="admin"
        )


@receiver(post_migrate)
def create_test_client(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="client").exists():
        User.objects.create_user(
            username="client",
            email="client@ba.la",
            password="client",
            first_name="Jose",
        )


@receiver(post_migrate)
def create_test_agent(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="agent").exists():
        User.objects.create_user(
            username="agent",
            email="agent@ba.la",
            password="agent",
            first_name="Carolyn",
        )


@receiver(post_migrate)
def create_test_organization(sender: Any, **kwargs: Any) -> None:
    if (
        settings.IS_LOCAL_DEV
        and not Organization.objects.filter(name="test_org").exists()
    ):
        test_usernames = ["admin", "agent"]
        test_users = User.objects.filter(username__in=test_usernames)
        test_org = Organization.objects.create(name="test_org")
        for test_user in test_users:
            test_org.add_user(test_user)


@receiver(pre_delete, sender=Organization)
def handle_organization_removed(
    sender: Any, instance: Organization, **kwargs: Any
) -> None:
    remove_organization_permission_group(instance)
    logger.info(f"Organization {instance.name} was removed.")


@receiver(post_save, sender=OrganizationUser)
def handle_organization_user_added(
    sender: Any, instance: OrganizationUser, created: bool, **kwargs: Any
) -> None:
    user: User = instance.user
    organization: Organization = instance.organization
    if created:
        add_default_org_permissions_to_user(user, organization)
    logger.info(f"User {user.username} was added to organization {organization.name}.")


@receiver(post_delete, sender=OrganizationUser)
def handle_organization_user_removed(
    sender: Any, instance: OrganizationUser, **kwargs: Any
) -> None:
    user: User = instance.user
    organization: Organization = instance.organization
    remove_org_group_permissions_from_user(user, organization)
    logger.info(
        f"User {user.username} was removed from organization {organization.name}."
    )


@receiver(post_migrate)
def update_group_permissions(sender: Any, **kwargs: Any) -> None:
    caseworker_permission_group_template = PermissionGroupTemplate.objects.get(
        name="Caseworker"
    )
    for (
        permission_group
    ) in caseworker_permission_group_template.permissiongroup_set.all():
        permission_group.group.permissions.set(
            caseworker_permission_group_template.permissions.all()
        )
