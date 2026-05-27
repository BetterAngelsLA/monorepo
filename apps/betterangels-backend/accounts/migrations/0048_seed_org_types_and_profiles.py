from django.db import migrations


def seed_org_types_and_backfill_profiles(apps, schema_editor):
    """Seed OrgType lookup rows and create OrganizationProfile for every existing org."""
    Organization = apps.get_model("organizations", "Organization")
    OrgType = apps.get_model("accounts", "OrgType")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")

    # Seed OrgType lookup rows
    outreach, _ = OrgType.objects.get_or_create(key="outreach", defaults={"label": "Outreach"})
    OrgType.objects.get_or_create(key="shelter", defaults={"label": "Shelter"})

    # Create profiles for all orgs that don't have one, defaulting to outreach type
    for org in Organization.objects.filter(profile__isnull=True):
        profile = OrganizationProfile.objects.create(organization=org)
        profile.org_types.add(outreach)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0047_add_org_type_and_profile"),
    ]

    operations = [
        migrations.RunPython(seed_org_types_and_backfill_profiles, migrations.RunPython.noop),
    ]
