"""
Integration tests for ``accounts.services`` and ``accounts.selectors``.
"""

import pytest
from accounts.groups import ORG_ADMIN
from accounts.models import OrganizationProfile, PermissionGroupTemplate, User
from accounts.selectors import permission_group_for_user
from accounts.services import (
    create_organization_with_presets,
    member_add,
    organization_remove_member,
)
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from model_bakery import baker
from notes.groups import CASEWORKER
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
def test_create_org_with_owner_roles() -> None:
    """Owner gets explicitly specified roles (not just defaults)."""
    owner = baker.make(User, email="owner@example.com")
    org = create_organization_with_presets(
        "Roleful Org", ["outreach"], owner=owner, owner_roles=(CASEWORKER, ORG_ADMIN)
    )

    # Owner should be a member and own the org.
    assert OrganizationUser.objects.filter(user=owner, organization=org).exists()

    caseworker_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name="Caseworker"
    )
    admin_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name="Organization Admin"
    )
    superuser_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name="Organization Superuser"
    )

    assert caseworker_group in owner.groups.all()
    assert admin_group in owner.groups.all()
    assert superuser_group not in owner.groups.all()


@pytest.mark.django_db(transaction=True)
def test_create_org_atomic() -> None:
    """If a preset throws mid-creation, nothing is persisted."""
    from organizations.models import Organization as OrgModel

    with pytest.raises(ValidationError):
        create_organization_with_presets("Atomic Org", ["outreach", "invalid"], owner=baker.make(User))
    assert not OrgModel.objects.filter(name="Atomic Org").exists()


# ── member_add ─────────────────────────────────────────────────────────


@pytest.mark.django_db(transaction=True)
def test_member_add_new_user() -> None:
    """member_add creates a new user and assigns them to the org with roles."""
    org = create_organization_with_presets("Member Org", ["outreach"], owner=baker.make(User))

    email = "new_guy@example.com"
    user = member_add(
        email=email,
        first_name="New",
        last_name="Guy",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )

    assert user.email == email
    assert user.first_name == "New"
    assert user.last_name == "Guy"
    assert not user.has_usable_password()
    assert OrganizationUser.objects.filter(user=user, organization=org).exists()

    caseworker_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name="Caseworker"
    )
    assert caseworker_group in user.groups.all()


@pytest.mark.django_db(transaction=True)
def test_member_add_existing_user_different_org() -> None:
    """Adding an existing user to a new org assigns them that org's roles."""
    user = baker.make(User, email="dual_citizen@example.com")
    org_1 = create_organization_with_presets("Org 1", ["outreach"], owner=baker.make(User))
    org_2 = create_organization_with_presets("Org 2", ["outreach"], owner=baker.make(User))

    assert user.email is not None
    # User is not yet in either org.
    member_add(
        email=user.email,
        first_name="Dual",
        last_name="Citizen",
        middle_name=None,
        organization=org_1,
        permission_templates=(CASEWORKER,),
    )

    cw_org1 = Group.objects.get(permissiongroup__organization=org_1, permissiongroup__template__name="Caseworker")
    assert cw_org1 in user.groups.all()

    assert user.email is not None
    # Add to second org — should not duplicate the User record.
    member_add(
        email=user.email,
        first_name="Dual",
        last_name="Citizen",
        middle_name=None,
        organization=org_2,
        permission_templates=(CASEWORKER,),
    )

    assert User.objects.filter(email=user.email).count() == 1
    cw_org2 = Group.objects.get(permissiongroup__organization=org_2, permissiongroup__template__name="Caseworker")
    assert cw_org2 in user.groups.all()


@pytest.mark.django_db(transaction=True)
def test_member_add_already_member() -> None:
    """member_add does NOT raise when user is already in the org — it skips
    duplicate templates."""
    org = create_organization_with_presets("Already Org", ["outreach"], owner=baker.make(User))

    member_add(
        email="already@here.com",
        first_name="Already",
        last_name="Here",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )

    # Adding the same templates is a no-op, not an error.
    user = member_add(
        email="already@here.com",
        first_name="Already",
        last_name="Here",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )
    assert user.email == "already@here.com"


@pytest.mark.django_db(transaction=True)
def test_member_add_cross_portal_reinvite() -> None:
    """Adding an existing member through a different portal adds the new
    permission template without raising an error.

    Simulates: a user is already an outreach Caseworker; later an admin
    tries to add them as a Shelter Operator through the shelter portal.
    """
    from shelters.groups import SHELTER_OPERATOR

    # Create a dual-type org (outreach + shelter) so both templates exist.
    org = create_organization_with_presets("Portal Org", ["outreach", "shelter"], owner=baker.make(User))

    # First call — outreach portal adds Caseworker.
    user = member_add(
        email="portal_user@example.com",
        first_name="Portal",
        last_name="User",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )
    assert OrganizationUser.objects.filter(user=user, organization=org).exists()
    cw_group = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name="Caseworker")
    assert cw_group in user.groups.all()

    # Second call — shelter portal adds Shelter Operator for same user.
    user2 = member_add(
        email="portal_user@example.com",
        first_name="Portal",
        last_name="User",
        middle_name=None,
        organization=org,
        permission_templates=(SHELTER_OPERATOR,),
    )
    assert user2.pk == user.pk  # same user, no duplicate
    so_group = Group.objects.get(
        permissiongroup__organization=org,
        permissiongroup__template__name="Shelter Operator",
    )
    assert so_group in user2.groups.all()
    assert cw_group in user2.groups.all()  # still has original role


@pytest.mark.django_db(transaction=True)
def test_member_add_multiple_templates() -> None:
    """member_add can assign multiple permission templates at once."""
    owner = baker.make(User)
    org = create_organization_with_presets("Multi Template Org", ["outreach"], owner=owner)

    user = member_add(
        email="multi@example.com",
        first_name="Multi",
        last_name="Template",
        middle_name="M",
        organization=org,
        permission_templates=(CASEWORKER, ORG_ADMIN),
    )

    cw = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name="Caseworker")
    admin = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name="Organization Admin")

    assert cw in user.groups.all()
    assert admin in user.groups.all()


@pytest.mark.django_db(transaction=True)
def test_member_add_persists_new_name() -> None:
    """When an existing user (by email) is added with different name fields,
    the new name values are NOT overwritten (the old user record is reused)."""
    org = create_organization_with_presets("Name Org", ["outreach"], owner=baker.make(User))
    baker.make(User, email="keep_my_name@example.com", first_name="Original", last_name="Name")

    user = member_add(
        email="keep_my_name@example.com",
        first_name="Ignored",
        last_name="AlsoIgnored",
        middle_name="X",
        organization=org,
        permission_templates=(CASEWORKER,),
    )

    # Name should stay as the original (existing user is reused, new data not applied).
    assert user.first_name == "Original"
    assert user.last_name == "Name"


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


# ── organization_remove_member ────────────────────────────────────────


@pytest.mark.django_db(transaction=True)
class TestOrganizationRemoveMember:
    """Tests for organization_remove_member."""

    def test_removes_member_and_clears_roles(self) -> None:
        """Removing a member deletes their OrganizationUser and clears roles."""
        owner = baker.make(User)
        org = create_organization_with_presets("Remove Org", ["outreach"], owner=owner)

        member = member_add(
            email="remove_me@example.com",
            first_name="Remove",
            last_name="Me",
            middle_name=None,
            organization=org,
            permission_templates=(CASEWORKER,),
        )

        assert OrganizationUser.objects.filter(user=member, organization=org).exists()

        cw_group = Group.objects.get(
            permissiongroup__organization=org,
            permissiongroup__template__name="Caseworker",
        )
        assert cw_group in member.groups.all()

        removed_id = organization_remove_member(organization=org, user_id=member.pk, removed_by=owner)

        assert removed_id == member.pk
        assert not OrganizationUser.objects.filter(user=member, organization=org).exists()
        assert cw_group not in member.groups.all()

    def test_cannot_remove_owner(self) -> None:
        """Raises ValidationError when trying to remove the org owner."""
        owner = baker.make(User)
        org = create_organization_with_presets("Owner Org", ["outreach"], owner=owner)

        with pytest.raises(ValidationError, match="cannot remove the organization owner"):
            organization_remove_member(organization=org, user_id=owner.pk, removed_by=owner)

    def test_cannot_remove_self(self) -> None:
        """Raises ValidationError when trying to remove yourself."""
        owner = baker.make(User)
        org = create_organization_with_presets("Self Org", ["outreach"], owner=owner)

        member = member_add(
            email="self@example.com",
            first_name="Self",
            last_name="Removal",
            middle_name=None,
            organization=org,
            permission_templates=(CASEWORKER,),
        )

        # A non-owner member cannot remove themselves.
        with pytest.raises(ValidationError, match="You cannot remove yourself"):
            organization_remove_member(organization=org, user_id=member.pk, removed_by=member)

    def test_remove_nonexistent_member(self) -> None:
        """Raises ValidationError when the user is not a member."""
        owner = baker.make(User)
        org = create_organization_with_presets("Ghost Org", ["outreach"], owner=owner)

        ghost = baker.make(User)

        with pytest.raises(ValidationError, match="not a member"):
            organization_remove_member(organization=org, user_id=ghost.pk, removed_by=owner)
