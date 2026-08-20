"""Require an org type on every organization profile that exists.

``OrganizationProfile.organization`` was an ``AutoOneToOneField``, which created a
profile row as a side effect of *reading* ``org.profile``.  Every organization
therefore appeared to have a profile while carrying an empty ``org_types``, and an
organization with no org type can hold no roles and accept no members.

The field becomes a plain ``OneToOneField``, so profiles are created explicitly,
and a check constraint requires at least one org type on the profiles that remain.

Existing rows are resolved from evidence rather than a blanket default.  An
organization whose permission groups imply a type gets that type; one with members
but nothing to infer from falls back to outreach and is printed, because that is a
guess someone should see.  An organization with no members and nothing to infer
from keeps no profile at all: the constraint governs profiles that exist, and an
``Organization`` is allowed to have none.  That state means "not configured as a
tenant yet", which is the truth for these rows — inventing a type for them would
assert something we do not know, and would provision roles nobody uses.
"""

from collections import defaultdict

import django.contrib.postgres.fields
import django.db.models.deletion
import django_choices_field.fields
from django.db import migrations, models

# Only these templates identify an org type.  Organization Admin and Organization
# Superuser belong to every org type, so they say nothing.
TEMPLATE_TO_ORG_TYPE = {
    "Caseworker": "outreach",
    "Shelter Operator": "shelter",
}
FALLBACK_ORG_TYPES = ["outreach"]


def decide_org_types(existing_types, inferred_types, has_members):
    """Return the org types to store for one organization, or ``None`` for no profile.

    Pure function — no database — so the rule that decides whether an
    organization is configured as a tenant can be tested directly.  The data
    state it reads from is forbidden by the check constraint this migration adds,
    which is why the decision is tested here and its effects are verified by
    running the migration itself.
    """
    if existing_types:
        return list(existing_types)
    if inferred_types:
        return sorted(inferred_types)
    if has_members:
        return list(FALLBACK_ORG_TYPES)
    return None


def backfill_org_types(apps, schema_editor):
    Organization = apps.get_model("organizations", "Organization")
    OrganizationUser = apps.get_model("organizations", "OrganizationUser")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")
    PermissionGroup = apps.get_model("accounts", "PermissionGroup")

    profiles = {p.organization_id: p for p in OrganizationProfile.objects.all()}

    inferred = defaultdict(set)
    for organization_id, template_name in PermissionGroup.objects.filter(
        template__name__in=TEMPLATE_TO_ORG_TYPE
    ).values_list("organization_id", "template__name"):
        inferred[organization_id].add(TEMPLATE_TO_ORG_TYPE[template_name])

    has_members = set(OrganizationUser.objects.values_list("organization_id", flat=True))

    already_typed = configured = removed = 0
    guessed = []

    for organization in Organization.objects.all():
        profile = profiles.get(organization.pk)
        existing = profile.org_types if profile is not None else []
        if existing:
            already_typed += 1
            continue

        inferred_types = inferred.get(organization.pk, set())
        org_types = decide_org_types(existing, inferred_types, organization.pk in has_members)
        if org_types and not inferred_types:
            guessed.append(f"{organization.pk} {organization.name!r}")

        if org_types:
            if profile is None:
                OrganizationProfile.objects.create(organization=organization, org_types=org_types)
            else:
                profile.org_types = org_types
                profile.save(update_fields=["org_types"])
            configured += 1
        elif profile is not None:
            profile.delete()
            removed += 1

    print(
        f"\n  org types: {already_typed} already set, {configured} resolved from permission groups,"
        f" {removed} empty profiles removed (organization left unconfigured)"
    )
    if guessed:
        print(f"  GUESSED {FALLBACK_ORG_TYPES} — has members but nothing to infer from ({len(guessed)}):")
        for entry in guessed:
            print(f"    {entry}")


def restore_empty_profiles(apps, schema_editor):
    """Give every organization a profile again, empty where none was kept.

    Restores the state the ``AutoOneToOneField`` produced, which is what the
    reversed schema expects.  Resolved org types are left in place; they were
    derived from the organization's own permission groups, so they stay correct.
    """
    Organization = apps.get_model("organizations", "Organization")
    OrganizationProfile = apps.get_model("accounts", "OrganizationProfile")

    existing = set(OrganizationProfile.objects.values_list("organization_id", flat=True))
    OrganizationProfile.objects.bulk_create(
        [
            OrganizationProfile(organization=organization, org_types=[])
            for organization in Organization.objects.all()
            if organization.pk not in existing
        ]
    )


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
        migrations.RunPython(backfill_org_types, restore_empty_profiles),
        migrations.AddConstraint(
            model_name="organizationprofile",
            constraint=models.CheckConstraint(
                condition=models.Q(("org_types__len__gt", 0)),
                name="org_profile_has_org_type",
                violation_error_message="An organization must have at least one org type.",
            ),
        ),
    ]
