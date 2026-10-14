"""Rename permission groups to ``<organization> [<pk>] · <role>``.

``auth.Group.name`` is unique and limited to 150 characters, while
``Organization.name`` is neither unique nor short.  Deriving the group name from
the organization's name alone therefore collided outright between two
organizations sharing a name.  Including the pk makes it unique by construction,
while keeping the organization's name makes the label readable where it is shown
— the group picker on a user, and the ``auth.Group`` changelist.  Organization
first so those lists sort alphabetically by organization rather than by
pk-as-string, and truncated because ``Organization.name`` allows more characters
than ``auth.Group.name`` does.

The name carries a copy of the organization's, kept current by
``accounts.services.reconcile_org_groups``.  Nothing reads it as data — every
lookup goes through ``PermissionGroup`` — so it is a label, not a key.

Because that reconcile also runs on ``post_migrate``, this rename is belt and
braces: the next migrate would relabel everything anyway.  It is kept so the
migration does not depend on signal wiring, and because it is what reports the
orphans below.  The same coupling means **reversing this migration while running
this code does not restore the legacy names** — ``restore_group_names`` writes
them and ``post_migrate`` immediately writes the new ones back.  Reversing is
only meaningful alongside a rollback to code without that reconcile, where it
behaves as written.

Groups with no ``PermissionGroup`` row are reported, not modified.  The old
reconcile could orphan one by deleting through a queryset, which bypassed the
model's ``delete()`` — but it only ever reached that delete for an organization
whose ``org_types`` was populated, and production had none, so no orphan of that
kind exists.  Re-attaching by name would mean matching on ``Organization.name``,
which is not unique; with nothing to recover, the safe move is to name what was
found and let a human decide.
"""

from django.db import migrations


GROUP_NAME_MAX_LENGTH = 150


def new_group_name(organization_name, organization_id, template_name):
    suffix = f" [{organization_id}] · {template_name}"
    budget = max(GROUP_NAME_MAX_LENGTH - len(suffix), 0)
    return f"{organization_name[:budget]}{suffix}"[:GROUP_NAME_MAX_LENGTH]


def legacy_group_name(organization_name, template_name):
    return f"{organization_name}_{template_name}"


def rename_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    renamed = 0
    for permission_group in PermissionGroup.objects.select_related("group", "template", "organization"):
        template_name = permission_group.template.name if permission_group.template_id else permission_group.name
        wanted = new_group_name(
            permission_group.organization.name, permission_group.organization_id, template_name
        )
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
