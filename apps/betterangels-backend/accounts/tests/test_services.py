"""
Integration tests for ``accounts.services``.
"""

import pytest
from accounts.models import OrganizationProfile, OrgTypeChoices, PermissionGroupTemplate, User
from accounts.services import (
    create_organization_with_presets,
    get_member_permission_group,
    get_user_permission_group_for_org,
)
from django.core.exceptions import ValidationError
from model_bakery import baker

# ── create_organization_with_presets ──────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test_create_outreach_org() -> None:
    """Outreach org gets Caseworker + Org Admin + Org Superuser groups."""
    org = create_organization_with_presets("Outreach Org", ["outreach"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert [t.value for t in profile.org_types] == ["outreach"]

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {"Caseworker", "Organization Admin", "Organization Superuser"}


@pytest.mark.django_db(transaction=True)
def test_create_shelter_org() -> None:
    """Shelter org gets Shelter Operator + Org Admin + Org Superuser groups."""
    org = create_organization_with_presets("Shelter Org", ["shelter"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert [t.value for t in profile.org_types] == ["shelter"]

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {"Shelter Operator", "Organization Admin", "Organization Superuser"}


@pytest.mark.django_db(transaction=True)
def test_create_dual_type_org() -> None:
    """Dual-type org deduplicates shared templates."""
    org = create_organization_with_presets("Dual Org", ["outreach", "shelter"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert set(t.value for t in profile.org_types) == {"outreach", "shelter"}

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {"Caseworker", "Shelter Operator", "Organization Admin", "Organization Superuser"}


@pytest.mark.django_db(transaction=True)
def test_create_org_invalid_preset() -> None:
    """Invalid preset name raises ValidationError."""
    with pytest.raises(ValidationError, match="Unknown org-type preset"):
        create_organization_with_presets("Bad Org", ["nonexistent"], owner=baker.make(User))


@pytest.mark.django_db(transaction=True)
def test_create_org_atomic() -> None:
    """If a preset throws mid-creation, nothing is persisted."""
    from organizations.models import Organization as OrgModel

    with pytest.raises(ValidationError):
        create_organization_with_presets("Atomic Org", ["outreach", "invalid"], owner=baker.make(User))
    assert not OrgModel.objects.filter(name="Atomic Org").exists()


# ── get_member_permission_group ───────────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test_member_group_outreach() -> None:
    """get_member_permission_group returns Caseworker for outreach org."""
    org = create_organization_with_presets("Outreach PM", ["outreach"], owner=baker.make(User))
    pg = get_member_permission_group(org)
    assert pg.template is not None
    assert pg.template.name == "Caseworker"


@pytest.mark.django_db(transaction=True)
def test_member_group_shelter() -> None:
    """get_member_permission_group returns Shelter Operator for shelter org."""
    org = create_organization_with_presets("Shelter PM", ["shelter"], owner=baker.make(User))
    pg = get_member_permission_group(org)
    assert pg.template is not None
    assert pg.template.name == "Shelter Operator"


@pytest.mark.django_db(transaction=True)
def test_member_group_dual_type() -> None:
    """Dual-type org uses first org_type (outreach → Caseworker)."""
    org = create_organization_with_presets("Dual PM", ["outreach", "shelter"], owner=baker.make(User))
    pg = get_member_permission_group(org)
    assert pg.template is not None
    assert pg.template.name == "Caseworker"


@pytest.mark.django_db(transaction=True)
def test_member_group_no_profile() -> None:
    """Org without OrganizationProfile raises ValidationError."""
    from organizations.models import Organization as OrgModel

    org = OrgModel.objects.create(name="No Profile Org")
    with pytest.raises(ValidationError, match="has no org_types"):
        get_member_permission_group(org)


@pytest.mark.django_db(transaction=True)
def test_member_group_no_org_types() -> None:
    """Org with empty org_types raises ValidationError."""
    from organizations.models import Organization as OrgModel

    org = OrgModel.objects.create(name="Empty Types Org")
    OrganizationProfile.objects.create(organization=org, org_types=[])
    with pytest.raises(ValidationError, match="has no org_types"):
        get_member_permission_group(org)


@pytest.mark.django_db(transaction=True)
def test_member_group_unknown_type() -> None:
    """Org with org_type not in registry raises ValidationError."""
    from organizations.models import Organization as OrgModel

    org = OrgModel.objects.create(name="Unknown Type Org")
    OrganizationProfile.objects.create(organization=org, org_types=[OrgTypeChoices.SHELTER])

    # Delete the shelter PermissionGroups so the lookup fails
    from accounts.models import PermissionGroup

    PermissionGroup.objects.filter(organization=org).delete()
    with pytest.raises(ValidationError, match="not found"):
        get_member_permission_group(org)


# ── get_user_permission_group_for_org ─────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test_user_permission_group() -> None:
    """Returns the member group for a user in their outreach org."""
    from accounts.models import User
    from model_bakery import baker
    from organizations.models import OrganizationUser

    org = create_organization_with_presets("User PM Org", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="pmuser", email="pm@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = get_user_permission_group_for_org(user, str(org.pk))
    assert pg.template is not None
    assert pg.template.name == "Caseworker"
    assert pg.organization == org


@pytest.mark.django_db(transaction=True)
def test_user_permission_group_not_member() -> None:
    """Raises if user doesn't belong to the org."""
    from accounts.models import User
    from model_bakery import baker

    org = create_organization_with_presets("Not Member Org", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="outsider", email="outsider@example.com")

    with pytest.raises(ValidationError, match="is not a member"):
        get_user_permission_group_for_org(user, str(org.pk))


@pytest.mark.django_db(transaction=True)
def test_user_permission_group_org_not_found() -> None:
    """Raises if org_id doesn't exist."""
    from accounts.models import User
    from model_bakery import baker

    user = baker.make(User, username="ghost", email="ghost@example.com")
    with pytest.raises(ValidationError, match="not found"):
        get_user_permission_group_for_org(user, "99999")
