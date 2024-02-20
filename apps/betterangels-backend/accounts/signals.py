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

from .models import User

logger = logging.getLogger(__name__)


@receiver(post_migrate)
def create_superuser(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin", email="admin@ba.la", password="password"
        )


@receiver(post_migrate)
def create_test_client(sender: Any, **kwargs: Any) -> None:
    if settings.IS_LOCAL_DEV and not User.objects.filter(username="client").exists():
        User.objects.create(username="client", email="client@ba.la", password="client")


@receiver(post_migrate)
def create_test_organization(sender: Any, **kwargs: Any) -> None:
    if (
        settings.IS_LOCAL_DEV
        and not Organization.objects.filter(name="test_org").exists()
    ):
        test_org = Organization.objects.create(name="test_org")
        admin = User.objects.filter(username="admin").first()
        test_org.add_user(admin)


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


# @receiver(post_save, sender=User)
# def add_user_to_org(sender: Any, instance: User, created: Any, **kwargs: Any) -> None:
#     from IPython import embed

#     embed()
#     if (
#         not instance.organizations_organizationuser.count()
#         # not instance.organizations_organization.order_by("id").first()
#         # not instance.organizations_organization.count()
#         and instance.email.split("@")[1] in "betterangels.la"
#     ):
#         embed()
#         organization = Organization.objects.get(name="test_org")
#         organization.add_user(instance)
