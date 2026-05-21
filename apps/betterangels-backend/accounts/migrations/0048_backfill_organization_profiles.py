from django.db import migrations


def backfill_profiles(apps, schema_editor):
    """Create an OrganizationProfile (defaulting to outreach) for every org that lacks one."""
    Organization = apps.get_model("organizations", "Organization")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")

    orgs_without_profile = Organization.objects.filter(profile__isnull=True)
    profiles = [OrganizationProfile(organization=org, org_type="outreach") for org in orgs_without_profile]
    OrganizationProfile.objects.bulk_create(profiles, ignore_conflicts=True)


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0047_add_organization_profile"),
    ]

    operations = [
        migrations.RunPython(backfill_profiles, migrations.RunPython.noop),
    ]
