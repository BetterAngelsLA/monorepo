from django.db import migrations


def modify_shelter_group_permissions(apps, schema_editor):
    """
    shelters | contact info | x4
    shelters | demographic | x4
    shelters | exterior photo | x4
    shelters | room style | x4
    shelters | shelter program | x4
    shelters | shelter type | x4
    shelters | special situation restriction | x4
    shelters | training service | x4
    shelters | video | x4


    additional contacts
    exterior photos
    interior photos
    videos
    """
    Group = apps.get_model("auth", "Group")
    Permission = apps.get_model("auth", "Permission")
    ContentType = apps.get_model("contenttypes", "ContentType")

    from common.permissions.enums import AddressPermissions

    # from shelters.permissions import

    Address = apps.get_model("common", "Address")

    # Data Entry Group
    data_entry_permission_map = {
        Address: [AddressPermissions],
    }
    group, created = Group.objects.get_or_create(name="Shelter Data Entry")

    for model, perm_enums in data_entry_permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for perm_enum in perm_enums:
            for perm in perm_enum:
                try:
                    permission, created = Permission.objects.get_or_create(
                        codename=perm.value.split(".")[1], content_type=content_type, name=perm.label
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {perm.value} not found for content type {content_type}")

    # Administration Group
    administration_permission_map = {
        Address: [AddressPermissions],
    }
    group, created = Group.objects.get_or_create(name="Shelter Administration")

    for model, perm_enums in administration_permission_map.items():
        content_type = ContentType.objects.get_for_model(model)
        for perm_enum in perm_enums:
            for perm in perm_enum:
                try:
                    permission, created = Permission.objects.get_or_create(
                        codename=perm.value.split(".")[1], content_type=content_type, name=perm.label
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    print(f"Permission {perm.value} not found for content type {content_type}")


class Migration(migrations.Migration):

    dependencies = [
        ("shelters", "0013_shelter_geolocation"),
    ]

    operations = [
        migrations.RunPython(modify_shelter_group_permissions),
    ]
