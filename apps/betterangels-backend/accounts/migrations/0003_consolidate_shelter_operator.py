"""Migrate users from legacy Shelter Data Entry / Administration auth.Groups
into the managed ``GLOBAL_SHELTER_OPERATOR`` permission template.

The old groups were global (not org-scoped).  For each user we find their
org(s) via OrganizationUser and add them to the corresponding
``GLOBAL_SHELTER_OPERATOR`` PermissionGroup.
"""

import logging

from django.contrib.auth.models import Group
from django.db import migrations
from django.db.models import Count

logger = logging.getLogger(__name__)

OLD_GROUP_NAMES = ["Shelter Data Entry", "Shelter Administration"]


def migrate_to_global_shelter_operator(apps, schema_editor):
    """Move users from legacy global auth groups → org-scoped PermissionGroups."""
    OrganizationUser = apps.get_model("organizations", "OrganizationUser")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    old_groups = Group.objects.filter(name__in=OLD_GROUP_NAMES)
    if not old_groups.exists():
        return

    users_in_old = (
        old_groups.annotate(user_count=Count("user"))
        .aggregate(total=Count("user", distinct=True))
        .get("total", 0)
    )
    if not users_in_old:
        old_groups.delete()
        return

    new_template, created = PermissionGroupTemplate.objects.get_or_create(
        name="Global Shelter Operator",
    )
    if created:
        logger.info("Created PermissionGroupTemplate: Global Shelter Operator")

    for old_group in old_groups:
        for user in old_group.user_set.all():
            # Find orgs this user belongs to.
            org_users = OrganizationUser.objects.filter(user=user).select_related("organization")
            for ou in org_users:
                org = ou.organization
                group_name = f"{org.name}_{new_template.name}"
                new_auth_group, _ = Group.objects.get_or_create(name=group_name)
                new_pg, created = PermissionGroup.objects.get_or_create(
                    organization=org,
                    template=new_template,
                    defaults={"group": new_auth_group, "name": new_template.name},
                )
                if created:
                    logger.info("Created PermissionGroup for org %s", org.name)
                new_pg.group.user_set.add(user)

        logger.info("Migrated %d users from %s", old_group.user_set.count(), old_group.name)

    # Cleanup old global groups.
    old_groups.delete()
    logger.info("Deleted legacy global auth groups: %s", OLD_GROUP_NAMES)


class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("accounts", "0002_organization_models"),
    ]

    operations = [
        migrations.RunPython(
            migrate_to_global_shelter_operator,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
