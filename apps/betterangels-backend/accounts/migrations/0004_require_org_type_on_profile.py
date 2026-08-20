"""Require every organization to declare at least one org type.

``OrganizationProfile.organization`` was an ``AutoOneToOneField``, which created
a profile row as a side effect of *reading* ``org.profile``.  Every organization
therefore appeared to have a profile while carrying an empty ``org_types``, and
an organization with no org type can hold no roles and accept no members.

The field becomes a plain ``OneToOneField``, so profiles must now be created
explicitly.  Existing rows are backfilled before the constraint is applied:
org types are inferred from the permission groups the organization already has,
and organizations with nothing to infer from fall back to outreach.
"""

import django.contrib.postgres.fields
import django.db.models.deletion
import django_choices_field.fields
from django.db import migrations, models

# Only these templates identify an org type.  Organization Admin and
# Organization Superuser belong to every org type, so they say nothing.
TEMPLATE_TO_ORG_TYPE = {
    "Caseworker": "outreach",
    "Shelter Operator": "shelter",
}
FALLBACK_ORG_TYPES = ["outreach"]


def backfill_org_types(apps, schema_editor):
    Organization = apps.get_model("organizations", "Organization")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    profiles_by_org = {p.organization_id: p for p in OrganizationProfile.objects.all()}
    inferred: dict[int, set[str]] = {}
    for org_id, template_name in PermissionGroup.objects.filter(
        template__name__in=TEMPLATE_TO_ORG_TYPE
    ).values_list("organization_id", "template__name"):
        inferred.setdefault(org_id, set()).add(TEMPLATE_TO_ORG_TYPE[template_name])

    created, filled, defaulted = 0, 0, []
    for org in Organization.objects.all():
        org_types = sorted(inferred.get(org.pk, set()))
        profile = profiles_by_org.get(org.pk)

        if profile is not None and profile.org_types:
            continue

        if not org_types:
            org_types = list(FALLBACK_ORG_TYPES)
            defaulted.append(org.name)

        if profile is None:
            OrganizationProfile.objects.create(organization=org, org_types=org_types)
            created += 1
        else:
            profile.org_types = org_types
            profile.save(update_fields=["org_types"])
            filled += 1

    print(f"\n  org profiles created: {created}, backfilled: {filled}")
    if defaulted:
        print(f"  defaulted to {FALLBACK_ORG_TYPES} (nothing to infer from): {', '.join(defaulted)}")


def noop(apps, schema_editor):
    """Reverse is a no-op: the backfilled org types are the correct values."""


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_consolidate_shelter_operator"),
        ("organizations", "0006_alter_organization_slug"),
    ]

    operations = [
        migrations.AlterField(
            model_name="organizationprofile",
            name="organization",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="profile",
                to="organizations.organization",
            ),
        ),
        migrations.AlterField(
            model_name="organizationprofile",
            name="org_types",
            field=django.contrib.postgres.fields.ArrayField(
                base_field=django_choices_field.fields.TextChoicesField(
                    choices=[("outreach", "Outreach"), ("shelter", "Shelter")], max_length=8
                )
            ),
        ),
        migrations.RunPython(backfill_org_types, noop),
        migrations.AddConstraint(
            model_name="organizationprofile",
            constraint=models.CheckConstraint(
                condition=models.Q(("org_types__len__gt", 0)),
                name="org_profile_has_org_type",
                violation_error_message="An organization must have at least one org type.",
            ),
        ),
    ]
