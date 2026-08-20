"""Rename permission groups to ``org:<pk>:<template>``.

``auth.Group.name`` is unique and limited to 150 characters, while
``Organization.name`` is neither unique nor short.  Deriving the group name from
the organization's name therefore collided outright between two organizations
sharing a name, and left every group stale after a rename.  Keying on the
organization's pk makes the name unique by construction and stable.

Groups with no ``PermissionGroup`` row are reported, not modified.  The old
reconcile could orphan one by deleting through a queryset, which bypassed the
model's ``delete()`` — but it only ever reached that delete for an organization
whose ``org_types`` was populated, and production had none, so no orphan of that
kind exists.  Re-attaching by name would mean matching on ``Organization.name``,
which is not unique; with nothing to recover, the safe move is to name what was
found and let a human decide.
"""

from django.db import migrations


def new_group_name(organization_id, template_name):
    return f"org:{organization_id}:{template_name}"


def legacy_group_name(organization_name, template_name):
    return f"{organization_name}_{template_name}"


def rename_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    renamed = 0
    for permission_group in PermissionGroup.objects.select_related("group", "template"):
        template_name = permission_group.template.name if permission_group.template_id else permission_group.name
        wanted = new_group_name(permission_group.organization_id, template_name)
        if permission_group.group.name != wanted:
            permission_group.group.name = wanted
            permission_group.group.save(update_fields=["name"])
            renamed += 1

    orphans = sorted(Group.objects.filter(permissiongroup__isnull=True).values_list("name", flat=True))

    print(f"\n  groups renamed: {renamed}")
    if orphans:
        print(f"  groups with no permission group, left untouched ({len(orphans)}): {', '.join(orphans[:20])}")


def restore_group_names(apps, schema_editor):
    """Rebuild the old ``{org.name}_{template}`` names where they are free.

    Two same-named organizations reconstruct to the same string, which
    ``auth.Group.name`` forbids, so a taken name leaves the deterministic name in
    place.  Nothing is lost — the legacy name was always derived from the data.
    """
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    skipped = []
    for permission_group in PermissionGroup.objects.select_related("group", "template", "organization"):
        template_name = permission_group.template.name if permission_group.template_id else permission_group.name
        wanted = legacy_group_name(permission_group.organization.name, template_name)
        if wanted == permission_group.group.name:
            continue
        if Group.objects.filter(name=wanted).exclude(pk=permission_group.group_id).exists():
            skipped.append(permission_group.group.name)
            continue
        permission_group.group.name = wanted
        permission_group.group.save(update_fields=["name"])

    if skipped:
        print(f"\n  kept deterministic names, legacy name already taken ({len(skipped)}): {', '.join(sorted(skipped)[:20])}")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_require_org_type_on_profile"),
    ]

    operations = [
        migrations.RunPython(rename_groups, restore_group_names),
    ]
