import logging
from typing import Any

from accounts.utils import (
    add_default_org_permissions_to_user,
    create_default_org_permission_groups,
    is_org_type_default_template,
    remove_org_group_permissions_from_user,
    remove_organization_permission_group,
)
from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_delete, post_migrate, post_save, pre_delete
from django.dispatch import receiver
from organizations.models import Organization, OrganizationUser

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
        from accounts.models import OrganizationProfile

        test_usernames = ["admin", "agent"]
        test_users = User.objects.filter(username__in=test_usernames)
        test_org = Organization.objects.create(name="test_org")
        OrganizationProfile.objects.get_or_create(organization=test_org)
        for test_user in test_users:
            test_org.add_user(test_user)


@receiver(pre_delete, sender=Organization)
def handle_organization_removed(sender: Any, instance: Organization, **kwargs: Any) -> None:
    remove_organization_permission_group(instance)
    logger.info(f"Organization {instance.name} was removed.")


@receiver(post_save, sender=OrganizationUser)
def handle_organization_user_added(sender: Any, instance: OrganizationUser, created: bool, **kwargs: Any) -> None:
    user: User = instance.user
    organization: Organization = instance.organization
    if created:
        add_default_org_permissions_to_user(user, organization)
    logger.info(f"User {user.username} was added to organization {organization.name}.")


@receiver(post_save, sender=PermissionGroup)
def handle_default_perm_group_created(sender: Any, instance: PermissionGroup, created: bool, **kwargs: Any) -> None:
    """Creates the remaining default permission groups for an organization.

    When the primary member-role PermissionGroup for any org type (e.g.
    Caseworker for outreach, Shelter Operator for shelter) is created, this
    signal ensures the companion Admin and Superuser groups are also created.
    """
    if created and instance.template and is_org_type_default_template(instance.template.name):
        create_default_org_permission_groups(instance.organization)


@receiver(post_delete, sender=OrganizationUser)
def handle_organization_user_removed(sender: Any, instance: OrganizationUser, **kwargs: Any) -> None:
    user: User = instance.user
    organization: Organization = instance.organization
    remove_org_group_permissions_from_user(user, organization)
    logger.info(f"User {user.username} was removed from organization {organization.name}.")


@receiver(post_migrate)
def update_group_permissions(sender: Any, **kwargs: Any) -> None:
    with transaction.atomic():
        templates = PermissionGroupTemplate.objects.prefetch_related("permissions", "permissiongroup_set__group")

        for template in templates:
            perms = list(template.permissions.all())
            for pgt in template.permissiongroup_set.all():
                pgt.group.permissions.set(perms)
