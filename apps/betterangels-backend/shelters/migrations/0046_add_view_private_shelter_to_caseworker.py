from django.db import migrations


def add_view_private_shelter_to_caseworker(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Shelter = apps.get_model("shelters", "Shelter")
    shelter_ct = ContentType.objects.get_for_model(Shelter)
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")
    perm, _ = Permission.objects.get_or_create(
        codename="view_private_shelter",
        content_type=shelter_ct,
        defaults={"name": "Can view private shelters"},
    )
    caseworker_template.permissions.add(perm)


def remove_view_private_shelter_from_caseworker(apps, schema_editor):
    PermissionGroupTemplate = apps.get_model("accounts", "PermissionGroupTemplate")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")
    Shelter = apps.get_model("shelters", "Shelter")
    shelter_ct = ContentType.objects.get_for_model(Shelter)
    caseworker_template = PermissionGroupTemplate.objects.get(name="Caseworker")
    perm = Permission.objects.get(codename="view_private_shelter", content_type=shelter_ct)
    caseworker_template.permissions.remove(perm)


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0045_shelter_is_private"),
        ("accounts", "0045_add_view_reports_permission"),
    ]

    operations = [
        migrations.RunPython(
            add_view_private_shelter_to_caseworker,
            remove_view_private_shelter_from_caseworker,
        ),
    ]
