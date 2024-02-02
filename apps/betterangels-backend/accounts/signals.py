import logging
from typing import Any, Dict, Type

from accounts.utils import add_user_to_org, remove_user_from_org_groups
from django.conf import settings
from django.contrib.auth.models import Group
from django.db.models.base import ModelBase
from django.db.models.signals import post_delete, post_migrate, post_save
from django.dispatch import receiver
from organizations.models import Organization, OrganizationUser
from organizations.signals import user_added, user_removed

from .models import OrganizationPermissionGroup, User

# Get a logger instance
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
        add_user_to_org(user, organization)
    logger.info(f"User {user.username} was added to organization {organization.name}.")


@receiver(post_delete, sender=OrganizationUser)
def handle_organization_user_removed(
    sender: Any, instance: OrganizationUser, **kwargs: Any
) -> None:
    user: User = instance.user
    organization: Organization = instance.organization
    remove_user_from_org_groups(user, organization)
    logger.info(
        f"User {user.username} was removed from organization {organization.name}."
    )
