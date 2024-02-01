from accounts.groups import GroupNames
from django.db import migrations
from django.contrib.auth.models import Permission
from django.contrib.auth.management import create_permissions

from notes.permissions import NotePermissions

PERMISSIONS_TO_ADD = [
    NotePermissions.ADD.value,
    NotePermissions.CHANGE.value,
    NotePermissions.DELETE.value,
    NotePermissions.VIEW.value,
]

# Generate readable names based on the enum
PERM_MAP = {
    perm.value.split(".")[1]: "Can " + perm.name.lower().replace("_", " ") + " note"
    for perm in NotePermissions
}


def create_permissions_if_not_exist(apps, schema_editor):
    Note = apps.get_model("notes", "Note")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    NoteContentType = ContentType.objects.get_for_model(Note)
    db_alias = schema_editor.connection.alias

    perms = [
        Permission(
            codename=codename,
            name=name,
            content_type=NoteContentType,
        )
        for codename, name in PERM_MAP.items()
    ]
    Permission.objects.using(db_alias).bulk_create(perms)


def add_permissions_to_caseworker(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    caseworker_group = Group.objects.get(name=GroupNames.CASEWORKER.value)

    for codename, _ in PERM_MAP.items():
        permission, _ = Permission.objects.get_or_create(codename=codename)
        caseworker_group.permissions.add(permission)


def remove_permissions_from_caseworker(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    caseworker_group = Group.objects.get(name=GroupNames.CASEWORKER.value)

    for codename, _ in PERM_MAP.items():
        try:
            permission = Permission.objects.get(codename=codename)
            caseworker_group.permissions.remove(permission)
        except Permission.DoesNotExist:
            print(f"Permission with codename '{codename}' does not exist.")


class Migration(migrations.Migration):
    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("accounts", "0007_add_caseworker_role"),
        ("notes", "0002_noteuserobjectpermission_notegroupobjectpermission"),
    ]

    operations = [
        migrations.RunPython(create_permissions_if_not_exist),
        migrations.RunPython(
            add_permissions_to_caseworker, remove_permissions_from_caseworker
        ),
    ]
