import logging
from typing import Any

from accounts.utils import (
    add_default_org_permissions_to_user,
    remove_org_group_permissions_from_user,
)
from django.conf import settings
from django.db.models.signals import post_delete, post_migrate, post_save
from django.dispatch import receiver
from organizations.models import Organization, OrganizationUser

from .models import User

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin", email="admin@ba.la", password="admin"
        )


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
