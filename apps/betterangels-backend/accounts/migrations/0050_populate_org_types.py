from django.db import migrations


def migrate_org_types(apps, schema_editor):
    """Populate OrgType table and migrate OrganizationProfile.org_type CharField values to M2M."""
    OrgType = apps.get_model("accounts", "OrgType")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")

    # Seed OrgType lookup rows
    outreach, _ = OrgType.objects.get_or_create(key="outreach", defaults={"label": "Outreach"})
    shelter, _ = OrgType.objects.get_or_create(key="shelter", defaults={"label": "Shelter"})

    type_map = {
        "outreach": outreach,
        "shelter": shelter,
    }

    # Migrate existing profiles
    for profile in OrganizationProfile.objects.all():
        old_type = profile.org_type
        if old_type in type_map:
            profile.org_types.add(type_map[old_type])


def reverse_migration(apps, schema_editor):
    """Reverse: copy first M2M type back to CharField."""
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")

    for profile in OrganizationProfile.objects.all():
        first_type = profile.org_types.first()
        if first_type:
            profile.org_type = first_type.key
            profile.save(update_fields=["org_type"])


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0049_orgtype_m2m"),
    ]

    operations = [
        migrations.RunPython(migrate_org_types, reverse_migration),
    ]
