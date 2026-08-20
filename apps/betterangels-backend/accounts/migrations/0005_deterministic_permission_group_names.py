"""Rename permission groups to ``org:<pk>:<template>`` and re-attach orphans.

``auth.Group.name`` is unique and limited to 150 characters, while
``Organization.name`` is neither unique nor short.  Deriving the group name from
the organization's name therefore collided outright between two organizations
sharing a name, and left every group stale after a rename.  Keying on the
organization's pk makes the name unique by construction and stable.

This also repairs groups orphaned by the old reconcile, which deleted
``PermissionGroup`` rows through a queryset — bypassing the model's ``delete()``
and leaving the ``auth.Group`` behind.  Members kept the permissions with no
row left to revoke them through.  Any such group that can be matched back to an
organization and template is re-attached.
"""

import re

from django.db import migrations

OLD_NAME = re.compile(r"^(?P<org>.+)_(?P<template>[^_]+(?: [^_]+)*)$")


def new_group_name(organization_id, template_name):
    return f"org:{organization_id}:{template_name}"


def rename_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    renamed = 0
    for permission_group in PermissionGroup.objects.select_related("group", "template", "organization"):
        template_name = (
            permission_group.template.name if permission_group.template_id else permission_group.name
        )
        wanted = new_group_name(permission_group.organization_id, template_name)
        if permission_group.group.name != wanted:
            permission_group.group.name = wanted
            permission_group.group.save(update_fields=["name"])
            renamed += 1

    # Re-attach groups the old queryset delete orphaned.
    taken = set(
        PermissionGroup.objects.values_list("organization_id", "template__name")
    )
    templates = {t.name: t for t in PermissionGroupTemplate.objects.all()}
    org_names = {
        name: pk
        for pk, name in apps.get_model("organizations", "Organization").objects.values_list("pk", "name")
    }

    reattached, unmatched = 0, []
    for group in Group.objects.filter(permissiongroup__isnull=True):
        match = OLD_NAME.match(group.name)
        if not match:
            unmatched.append(group.name)
            continue
        org_id = org_names.get(match.group("org"))
        template = templates.get(match.group("template"))
        if org_id is None or template is None or (org_id, template.name) in taken:
            unmatched.append(group.name)
            continue
        PermissionGroup.objects.create(
            organization_id=org_id, template=template, group=group, name=template.name
        )
        group.name = new_group_name(org_id, template.name)
        group.save(update_fields=["name"])
        taken.add((org_id, template.name))
        reattached += 1

    print(f"\n  groups renamed: {renamed}, orphans re-attached: {reattached}")
    if unmatched:
        print(f"  orphaned groups left alone ({len(unmatched)}): {', '.join(sorted(unmatched)[:10])}")


def restore_group_names(apps, schema_editor):
    """Rebuild the old ``{org.name}_{template}`` names.

    Reversible only as far as the names go; re-attached ``PermissionGroup`` rows
    are left in place because they represent access the members already hold.
    """
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    for permission_group in PermissionGroup.objects.select_related("group", "template", "organization"):
        template_name = (
            permission_group.template.name if permission_group.template_id else permission_group.name
        )
        permission_group.group.name = f"{permission_group.organization.name}_{template_name}"
        permission_group.group.save(update_fields=["name"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_require_org_type_on_profile"),
    ]

    operations = [
        migrations.RunPython(rename_groups, restore_group_names),
    ]
