"""Seed OrgType rows and backfill OrganizationProfile for every existing Organization.

All existing orgs are tagged as 'outreach'.
"""

from django.db import migrations


ORG_TYPES = [
    {"key": "outreach", "label": "Outreach"},
    {"key": "shelter", "label": "Shelter"},
]


def seed_and_backfill(apps, schema_editor):
    OrgType = apps.get_model("accounts", "OrgType")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")
    Organization = apps.get_model("organizations", "Organization")

    # Seed org types
    org_type_objects = {}
    for ot in ORG_TYPES:
        obj, _ = OrgType.objects.get_or_create(key=ot["key"], defaults={"label": ot["label"]})
        org_type_objects[ot["key"]] = obj

    outreach_type = org_type_objects["outreach"]

    # Create profiles for all existing orgs and tag as outreach
    for org in Organization.objects.all():
        profile, _ = OrganizationProfile.objects.get_or_create(organization=org)
        profile.org_types.add(outreach_type)


def reverse(apps, schema_editor):
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")
    OrgType = apps.get_model("accounts", "OrgType")

    OrganizationProfile.objects.all().delete()
    OrgType.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0046_add_org_type_and_profile"),
    ]

    operations = [
        migrations.RunPython(seed_and_backfill, reverse),
    ]
