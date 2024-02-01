from accounts.groups import GroupNames
from django.db import migrations


def create_caseworker_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.get_or_create(name=GroupNames.CASEWORKER)


def remove_caseworker_group(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name=GroupNames.CASEWORKER).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0006_biguserobjectpermission_biggroupobjectpermission"),
    ]

    operations = [
        migrations.RunPython(create_caseworker_group, remove_caseworker_group),
    ]
