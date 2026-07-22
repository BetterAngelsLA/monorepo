"""Consolidate Shelter Data Entry + Shelter Administration → Global Shelter Operator.

Moves all users from the old legacy auth groups into the new consolidated
``GLOBAL_SHELTER_OPERATOR`` template, then deletes the old templates and
their PermissionGroups.
"""

import logging

from django.contrib.auth.models import Group
from django.db import migrations

logger = logging.getLogger(__name__)

OLD_TEMPLATE_NAMES = ["Shelter Data Entry", "Shelter Administration"]


def migrate_to_global_shelter_operator(apps, schema_editor):
    """Move users from old shelter templates → Global Shelter Operator."""
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Organization = apps.get_model("organizations", "Organization")

    old_templates = PermissionGroupTemplate.objects.filter(name__in=OLD_TEMPLATE_NAMES)
    if not old_templates.exists():
        return

    old_pgs = PermissionGroup.objects.filter(template__in=old_templates).select_related(
        "organization", "group"
    )
    if not old_pgs.exists():
        old_templates.delete()
        return

    new_template, created = PermissionGroupTemplate.objects.get_or_create(
        name="Global Shelter Operator",
    )
    if created:
        logger.info("Created PermissionGroupTemplate: Global Shelter Operator")

    # Group old PGs by org and move users
    migrated_orgs: set[int] = set()
    for old_pg in old_pgs:
        org = old_pg.organization
        if org.pk in migrated_orgs:
            continue
        migrated_orgs.add(org.pk)

        old_auth_group = old_pg.group
        if old_auth_group is None:
            continue

        # Create the new auth.Group + PermissionGroup for this org.
        group_name = f"{org.name}_{new_template.name}"
        new_auth_group, _ = Group.objects.get_or_create(name=group_name)
        new_pg, _ = PermissionGroup.objects.get_or_create(
            organization=org,
            template=new_template,
            defaults={"group": new_auth_group},
        )

        # Move users from old auth group(s) to the new one.
        for p in PermissionGroup.objects.filter(
            organization=org, template__in=old_templates
        ).select_related("group"):
            if p.group is not None:
                for user in p.group.user_set.all():
                    new_pg.group.user_set.add(user)

        logger.info("Migrated org %s to Global Shelter Operator", org.name)

    # Cleanup: delete old PermissionGroups (deletes their auth.Groups too).
    PermissionGroup.objects.filter(template__in=old_templates).delete()
    old_templates.delete()
    logger.info("Deleted old Shelter Data Entry / Shelter Administration templates")


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
