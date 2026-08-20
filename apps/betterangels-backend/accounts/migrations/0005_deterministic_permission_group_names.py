"""Rename permission groups to ``org:<pk>:<template>`` and re-attach orphans.

``auth.Group.name`` is unique and limited to 150 characters, while
``Organization.name`` is neither unique nor short.  Deriving the group name from
the organization's name therefore collided outright between two organizations
sharing a name, and left every group stale after a rename.  Keying on the
organization's pk makes the name unique by construction and stable.

This also repairs groups orphaned by the old reconcile, which deleted
``PermissionGroup`` rows through a queryset — bypassing the model's ``delete()``
and leaving the ``auth.Group`` behind.  Members kept the permissions while the
row needed to revoke them was gone.

Orphans are re-attached rather than deleted: the access was granted deliberately
(``0003`` moved users into Global Shelter Operator), so deleting the group would
revoke it from real users.  Re-attaching preserves the access and makes it
manageable again.

Recovery matches a legacy name to at most one ``(organization, template)`` pair.
Because organization names are not unique, two same-named organizations can both
claim the same legacy name; there is only one group, so such cases are reported
and skipped rather than guessed at.  Groups whose ``PermissionGroup`` had no
template are unrecoverable — the legacy name embedded an arbitrary label instead
of a template name, so the intended role is not knowable — and are reported too.
"""

from django.db import migrations


def new_group_name(organization_id, template_name):
    return f"org:{organization_id}:{template_name}"


def legacy_group_name(organization_name, template_name):
    return f"{organization_name}_{template_name}"


def resolve_orphans(organizations, template_names, orphan_names, taken):
    """Match orphaned group names to the pair that owns them.

    Pure function — no database access — so the risky part of this migration can
    be tested directly.

    ``organizations`` is an iterable of ``(pk, name)``, ``taken`` the set of
    ``(organization_id, template_name)`` pairs that already have a
    ``PermissionGroup``.  Returns ``(unique, ambiguous, unclaimed)`` where
    *unique* maps a group name to the single ``(organization_id, template_name)``
    that claims it, *ambiguous* maps a group name to every claimant when there is
    more than one, and *unclaimed* is the set no pair accounts for.
    """
    claims: dict[str, list[tuple[int, str]]] = {}
    for organization_id, organization_name in organizations:
        for template_name in template_names:
            if (organization_id, template_name) in taken:
                continue
            name = legacy_group_name(organization_name, template_name)
            if name in orphan_names:
                claims.setdefault(name, []).append((organization_id, template_name))

    unique = {name: pairs[0] for name, pairs in claims.items() if len(pairs) == 1}
    ambiguous = {name: pairs for name, pairs in claims.items() if len(pairs) > 1}
    unclaimed = set(orphan_names) - set(claims)
    return unique, ambiguous, unclaimed


def rename_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Organization = apps.get_model("organizations", "Organization")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")

    renamed = 0
    for permission_group in PermissionGroup.objects.select_related("group", "template"):
        template_name = permission_group.template.name if permission_group.template_id else permission_group.name
        wanted = new_group_name(permission_group.organization_id, template_name)
        if permission_group.group.name != wanted:
            permission_group.group.name = wanted
            permission_group.group.save(update_fields=["name"])
            renamed += 1

    templates = {t.name: t for t in PermissionGroupTemplate.objects.all()}
    taken = set(PermissionGroup.objects.values_list("organization_id", "template__name"))
    orphans = {name: pk for pk, name in Group.objects.filter(permissiongroup__isnull=True).values_list("pk", "name")}

    unique, ambiguous, unclaimed = resolve_orphans(
        organizations=Organization.objects.values_list("pk", "name"),
        template_names=list(templates),
        orphan_names=set(orphans),
        taken=taken,
    )

    for group_name, (organization_id, template_name) in sorted(unique.items()):
        PermissionGroup.objects.create(
            organization_id=organization_id,
            template=templates[template_name],
            group_id=orphans[group_name],
            name=template_name,
        )
        Group.objects.filter(pk=orphans[group_name]).update(name=new_group_name(organization_id, template_name))

    print(f"\n  groups renamed: {renamed}, orphans re-attached: {len(unique)}")
    if ambiguous:
        print(f"  AMBIGUOUS — same-named organizations both claim these, assign by hand ({len(ambiguous)}):")
        for group_name, pairs in sorted(ambiguous.items()):
            print(f"    {group_name!r} claimed by organizations {sorted(pk for pk, _ in pairs)}")
    if unclaimed:
        print(f"  unclaimed orphans, left alone ({len(unclaimed)}): {', '.join(sorted(unclaimed)[:20])}")


def restore_group_names(apps, schema_editor):
    """Rebuild the old ``{org.name}_{template}`` names where they are free.

    Two same-named organizations reconstruct to the same string, which
    ``auth.Group.name`` forbids, so a taken name leaves the deterministic name in
    place.  Nothing is lost — the legacy name was always derived from the data.

    Re-attached ``PermissionGroup`` rows are kept: they represent access the
    members already hold.
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
