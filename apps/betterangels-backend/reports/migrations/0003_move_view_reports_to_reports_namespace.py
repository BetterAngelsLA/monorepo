# Generated migration to move view_reports permission from organizations to reports namespace.

from django.db import migrations


def migrate_view_reports_permission(apps, schema_editor):
    """Move view_reports from Organization CT to ScheduledReport CT in all templates and groups."""
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    old_ct = ContentType.objects.get(app_label="organizations", model="organization")
    new_ct, _ = ContentType.objects.get_or_create(app_label="reports", model="scheduledreport")

    try:
        old_perm = Permission.objects.get(codename="view_reports", content_type=old_ct)
    except Permission.DoesNotExist:
        # Nothing to migrate
        return

    # Ensure new permission exists (Meta.permissions auto-creation happens post_migrate)
    new_perm, _ = Permission.objects.get_or_create(
        codename="view_reports",
        content_type=new_ct,
        defaults={"name": "Can view reports"},
    )

    # Migrate PermissionGroupTemplate references
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    for template in PermissionGroupTemplate.objects.filter(permissions=old_perm):
        template.permissions.add(new_perm)
        template.permissions.remove(old_perm)

    # Migrate Group references
    Group = apps.get_model("auth", "Group")
    for group in Group.objects.filter(permissions=old_perm):
        group.permissions.add(new_perm)
        group.permissions.remove(old_perm)

    # Delete the old permission
    old_perm.delete()


class Migration(migrations.Migration):

    dependencies = [
        ("reports", "0002_add_view_reports_permission"),
        ("accounts", "0045_add_view_reports_permission"),
    ]

    operations = [
        migrations.RunPython(migrate_view_reports_permission, migrations.RunPython.noop),
    ]
