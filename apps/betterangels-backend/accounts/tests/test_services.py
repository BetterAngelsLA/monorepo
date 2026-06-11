"""
Integration tests for ``accounts.services`` and ``accounts.selectors``.
"""

import pytest
from accounts.models import OrganizationProfile, PermissionGroupTemplate, User
from accounts.selectors import permission_group_for_user
from accounts.services import create_organization_with_presets
from django.core.exceptions import ValidationError
from model_bakery import baker
from organizations.models import OrganizationUser

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


# ── permission_group_for_user ─────────────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test_permission_group_caseworker() -> None:
    """Returns the Caseworker PermissionGroup for a user in their outreach org."""
    org = create_organization_with_presets("Outreach PM", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="pmuser", email="pm@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), "Caseworker")
    assert pg.template is not None
    assert pg.template.name == "Caseworker"
    assert pg.organization == org


@pytest.mark.django_db(transaction=True)
def test_permission_group_shelter_operator() -> None:
    """Returns the Shelter Operator PermissionGroup for a user in their shelter org."""
    org = create_organization_with_presets("Shelter PM", ["shelter"], owner=baker.make(User))
    user = baker.make(User, username="spmuser", email="spm@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), "Shelter Operator")
    assert pg.template is not None
    assert pg.template.name == "Shelter Operator"
    assert pg.organization == org


@pytest.mark.django_db(transaction=True)
def test_permission_group_dual_type() -> None:
    """User in a dual-type org can look up both member templates."""
    org = create_organization_with_presets("Dual PM", ["outreach", "shelter"], owner=baker.make(User))
    user = baker.make(User, username="dualuser", email="dual@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), "Caseworker")
    assert pg.template is not None
    assert pg.template.name == "Caseworker"

    pg2 = permission_group_for_user(user, str(org.pk), "Shelter Operator")
    assert pg2.template is not None
    assert pg2.template.name == "Shelter Operator"


@pytest.mark.django_db(transaction=True)
def test_permission_group_org_not_found() -> None:
    """Raises ValidationError if org_id doesn't exist."""
    user = baker.make(User, username="ghost", email="ghost@example.com")
    with pytest.raises(ValidationError, match="not found"):
        permission_group_for_user(user, "99999", "Caseworker")


@pytest.mark.django_db(transaction=True)
def test_permission_group_user_not_member() -> None:
    """Raises ValidationError if user doesn't belong to the org."""
    org = create_organization_with_presets("Not Member Org", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="outsider", email="outsider@example.com")

    with pytest.raises(ValidationError, match="is not a member"):
        permission_group_for_user(user, str(org.pk), "Caseworker")


@pytest.mark.django_db(transaction=True)
def test_permission_group_template_not_found() -> None:
    """Raises ValidationError if the requested template doesn't exist on the org."""
    org = create_organization_with_presets("Outreach Only", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="oo_user", email="oo@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    with pytest.raises(ValidationError, match="not found"):
        permission_group_for_user(user, str(org.pk), "Shelter Operator")
