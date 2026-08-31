"""
Integration tests for ``accounts.services`` and ``accounts.selectors``.
"""

import pytest
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization, OrganizationUser
from shelters.groups import GLOBAL_SHELTER_OPERATOR, SHELTER_OPERATOR

from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from accounts.models import OrganizationProfile, PermissionGroup, PermissionGroupTemplate, User
from accounts.selectors import permission_group_for_user
from accounts.services import (
    create_organization_service,
    create_organization_with_presets,
    get_or_create_user_by_email,
    member_add,
    member_roles_replace,
    organization_remove_member,
    reactivate_user,
)

# ── create_organization_with_presets ──────────────────────────────────


@pytest.mark.django_db
def test_create_outreach_org() -> None:
    """Outreach org gets Caseworker + Org Admin + Org Superuser groups."""
    org = create_organization_with_presets("Outreach Org", ["outreach"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert [t.value for t in profile.org_types] == ["outreach"]

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {CASEWORKER.name, ORG_ADMIN.name, ORG_SUPERUSER.name}


@pytest.mark.django_db
def test_create_shelter_org() -> None:
    """Shelter org gets Shelter Operator + Org Admin + Org Superuser groups."""
    org = create_organization_with_presets("Shelter Org", ["shelter"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert [t.value for t in profile.org_types] == ["shelter"]

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {SHELTER_OPERATOR.name, ORG_ADMIN.name, ORG_SUPERUSER.name}


@pytest.mark.django_db
def test_create_dual_type_org() -> None:
    """Dual-type org deduplicates shared templates."""
    org = create_organization_with_presets("Dual Org", ["outreach", "shelter"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert set(t.value for t in profile.org_types) == {"outreach", "shelter"}

    names = set(
        PermissionGroupTemplate.objects.filter(permissiongroup__organization=org).values_list("name", flat=True)
    )
    assert names == {CASEWORKER.name, SHELTER_OPERATOR.name, ORG_ADMIN.name, ORG_SUPERUSER.name}


@pytest.mark.django_db
def test_create_org_deduplicates_repeated_presets() -> None:
    """The same preset twice stores one org type, not two."""
    org = create_organization_with_presets("Repeated Org", ["outreach", "outreach"], owner=baker.make(User))

    profile = OrganizationProfile.objects.get(organization=org)
    assert [t.value for t in profile.org_types] == ["outreach"]


@pytest.mark.django_db
def test_create_org_invalid_preset() -> None:
    """Invalid preset name raises ValidationError."""
    with pytest.raises(ValidationError, match="Unknown org-type preset"):
        create_organization_with_presets("Bad Org", ["nonexistent"], owner=baker.make(User))


@pytest.mark.django_db
def test_create_org_with_owner_roles() -> None:
    """Owner gets explicitly specified roles (not just defaults)."""
    owner = baker.make(User, email="owner@example.com")
    org = create_organization_with_presets(
        "Roleful Org", ["outreach"], owner=owner, owner_roles=(CASEWORKER, ORG_ADMIN)
    )

    # Owner should be a member and own the org.
    assert OrganizationUser.objects.filter(user=owner, organization=org).exists()

    caseworker_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name=CASEWORKER.name
    )
    admin_group = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name=ORG_ADMIN.name)
    superuser_group = Group.objects.get(
        permissiongroup__organization=org, permissiongroup__template__name=ORG_SUPERUSER.name
    )

    assert caseworker_group in owner.groups.all()
    assert admin_group in owner.groups.all()
    assert superuser_group not in owner.groups.all()


@pytest.mark.django_db(transaction=True)
def test_create_org_atomic() -> None:
    """If a preset throws mid-creation, nothing is persisted.

    Uses ``transaction=True`` because this test intentionally triggers a
    ``ValidationError`` inside an atomic block — without a real transaction
    the DB state would leak between rollback attempts.
    """
    from organizations.models import Organization as OrgModel

    with pytest.raises(ValidationError):
        create_organization_with_presets("Atomic Org", ["outreach", "invalid"], owner=baker.make(User))
    assert not OrgModel.objects.filter(name="Atomic Org").exists()


@pytest.mark.django_db(transaction=True)
def test_create_org_with_owner_roles_refuses_org_bypass_role() -> None:
    """Org-bypassing roles are admin-only: they can't be named as owner roles.

    ``create_organization_with_presets`` is atomic, so the refused grant rolls
    the whole organization creation back.
    """
    from organizations.models import Organization as OrgModel

    owner = baker.make(User, email="bypass-owner@example.com")

    with pytest.raises(ValueError, match="Global Shelter Operator"):
        create_organization_with_presets(
            "Bypass Owner Org", ["shelter"], owner=owner, owner_roles=(GLOBAL_SHELTER_OPERATOR,)
        )

    assert not OrgModel.objects.filter(name="Bypass Owner Org").exists()


# ── get_or_create_user_by_email ───────────────────────────────────────


@pytest.mark.django_db
def test_get_or_create_user_by_email_new_user() -> None:
    """Brand-new email yields an active user with an unusable password and a
    normalized (lowercased, stripped) email."""
    user, created = get_or_create_user_by_email(" NewUser@Example.com ")

    assert created
    assert user.email == "newuser@example.com"
    assert user.is_active
    assert not user.has_usable_password()
    assert User.objects.filter(email="newuser@example.com").count() == 1


@pytest.mark.django_db
def test_get_or_create_user_by_email_leaves_inactive_user_unchanged() -> None:
    """The provisioning service has no side effects on existing users: a
    deactivated account is returned unchanged (reactivation is an explicit,
    authorized step via reactivate_user)."""
    existing = baker.make(User, email="sleepy@example.com", is_active=False)

    user, created = get_or_create_user_by_email("Sleepy@Example.com")

    assert not created
    assert user.pk == existing.pk
    assert not user.is_active  # left as-is
    assert User.objects.filter(email="sleepy@example.com").count() == 1


@pytest.mark.django_db
def test_reactivate_user() -> None:
    """reactivate_user reactivates a deactivated account and is a no-op for
    an active one."""
    inactive = baker.make(User, email="sleepy@example.com", is_active=False)
    active = baker.make(User, email="awake@example.com", is_active=True)

    reactivate_user(inactive)
    reactivate_user(active)

    inactive.refresh_from_db()
    active.refresh_from_db()
    assert inactive.is_active
    assert active.is_active


# ── member_add ─────────────────────────────────────────────────────────


@pytest.mark.django_db
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
        permissiongroup__organization=org, permissiongroup__template__name=CASEWORKER.name
    )
    assert caseworker_group in user.groups.all()


@pytest.mark.django_db
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

    cw_org1 = Group.objects.get(permissiongroup__organization=org_1, permissiongroup__template__name=CASEWORKER.name)
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
    cw_org2 = Group.objects.get(permissiongroup__organization=org_2, permissiongroup__template__name=CASEWORKER.name)
    assert cw_org2 in user.groups.all()


@pytest.mark.django_db
def test_member_add_reactivates_inactive_user() -> None:
    """Re-adding an existing-but-deactivated user reactivates them without
    creating a duplicate row."""
    org = create_organization_with_presets("Reactivate Org", ["outreach"], owner=baker.make(User))
    existing = baker.make(User, email="revive@example.com", is_active=False)

    user = member_add(
        email="revive@example.com",
        first_name="Revive",
        last_name="User",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )

    assert user.pk == existing.pk
    assert User.objects.filter(email="revive@example.com").count() == 1
    user.refresh_from_db()
    assert user.is_active


@pytest.mark.django_db
def test_member_add_mixed_case_email_finds_existing_user() -> None:
    """Mixed-case email input finds the existing (lowercased) user instead of
    creating a duplicate or raising IntegrityError."""
    org = create_organization_with_presets("Mixed Case Org", ["outreach"], owner=baker.make(User))
    existing = baker.make(User, email="mixedcase@example.com")

    user = member_add(
        email="MixedCase@Example.com",
        first_name="Mixed",
        last_name="Case",
        middle_name=None,
        organization=org,
        permission_templates=(CASEWORKER,),
    )

    assert user.pk == existing.pk
    assert User.objects.filter(email="mixedcase@example.com").count() == 1


@pytest.mark.django_db
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


@pytest.mark.django_db
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
    cw_group = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name=CASEWORKER.name)
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
        permissiongroup__template__name=SHELTER_OPERATOR.name,
    )
    assert so_group in user2.groups.all()
    assert cw_group in user2.groups.all()  # still has original role


@pytest.mark.django_db
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

    cw = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name=CASEWORKER.name)
    admin = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name=ORG_ADMIN.name)

    assert cw in user.groups.all()
    assert admin in user.groups.all()


@pytest.mark.django_db
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


@pytest.mark.django_db
def test_member_add_refuses_org_bypass_role() -> None:
    """member_add must never grant an org-bypassing role."""
    org = create_organization_with_presets("Guarded Member Org", ["shelter"], owner=baker.make(User))

    with pytest.raises(ValueError, match="Global Shelter Operator"):
        member_add(
            email="guard@example.com",
            first_name="Guard",
            last_name="Member",
            middle_name=None,
            organization=org,
            permission_templates=(GLOBAL_SHELTER_OPERATOR,),
        )

    # No bypass group is granted (the guard fires before any assignment).
    user = User.objects.get(email="guard@example.com")
    assert not PermissionGroup.objects.filter(
        organization=org, user=user, template__bypasses_org_scoping=True
    ).exists()


# ── permission_group_for_user ─────────────────────────────────────────


@pytest.mark.django_db
def test_permission_group_caseworker() -> None:
    """Returns the Caseworker PermissionGroup for a user in their outreach org."""
    org = create_organization_with_presets("Outreach PM", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="pmuser", email="pm@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), CASEWORKER.name)
    assert pg.template is not None
    assert pg.template.name == CASEWORKER.name
    assert pg.organization == org


@pytest.mark.django_db
def test_permission_group_shelter_operator() -> None:
    """Returns the Shelter Operator PermissionGroup for a user in their shelter org."""
    org = create_organization_with_presets("Shelter PM", ["shelter"], owner=baker.make(User))
    user = baker.make(User, username="spmuser", email="spm@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), SHELTER_OPERATOR.name)
    assert pg.template is not None
    assert pg.template.name == SHELTER_OPERATOR.name
    assert pg.organization == org


@pytest.mark.django_db
def test_permission_group_dual_type() -> None:
    """User in a dual-type org can look up both member templates."""
    org = create_organization_with_presets("Dual PM", ["outreach", "shelter"], owner=baker.make(User))
    user = baker.make(User, username="dualuser", email="dual@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    pg = permission_group_for_user(user, str(org.pk), CASEWORKER.name)
    assert pg.template is not None
    assert pg.template.name == CASEWORKER.name

    pg2 = permission_group_for_user(user, str(org.pk), SHELTER_OPERATOR.name)
    assert pg2.template is not None
    assert pg2.template.name == SHELTER_OPERATOR.name


@pytest.mark.django_db
def test_permission_group_org_not_found() -> None:
    """Raises ValidationError if org_id doesn't exist."""
    user = baker.make(User, username="ghost", email="ghost@example.com")
    with pytest.raises(ValidationError, match="not found"):
        permission_group_for_user(user, "99999", CASEWORKER.name)


@pytest.mark.django_db
def test_permission_group_user_not_member() -> None:
    """Raises ValidationError if user doesn't belong to the org."""
    org = create_organization_with_presets("Not Member Org", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="outsider", email="outsider@example.com")

    with pytest.raises(ValidationError, match="is not a member"):
        permission_group_for_user(user, str(org.pk), CASEWORKER.name)


@pytest.mark.django_db
def test_permission_group_template_not_found() -> None:
    """Raises ValidationError if the requested template doesn't exist on the org."""
    org = create_organization_with_presets("Outreach Only", ["outreach"], owner=baker.make(User))
    user = baker.make(User, username="oo_user", email="oo@example.com")
    baker.make(OrganizationUser, user=user, organization=org)

    with pytest.raises(ValidationError, match="not found"):
        permission_group_for_user(user, str(org.pk), SHELTER_OPERATOR.name)


# ── organization_remove_member ────────────────────────────────────────


@pytest.mark.django_db
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
            permissiongroup__template__name=CASEWORKER.name,
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


@pytest.mark.django_db
class TestMemberRolesReplace:
    """Tests for member_roles_replace."""

    def test_replaces_the_roles_the_organization_offers(self) -> None:
        owner = baker.make(User)
        org = create_organization_with_presets("Replace Org", ["outreach", "shelter"], owner=owner)

        member = member_add(
            email="replace@example.com",
            first_name="Replace",
            last_name="Me",
            middle_name=None,
            organization=org,
            permission_templates=(CASEWORKER,),
        )

        member_roles_replace(organization=org, user_id=member.pk, permission_templates=(SHELTER_OPERATOR,))

        assert _role_names(org, member) == {SHELTER_OPERATOR.name}

    def test_leaves_a_role_the_organization_does_not_offer_by_invitation(self) -> None:
        """Org Admin is ``is_invitable=False``, so no caller of this can name it."""
        owner = baker.make(User)
        org = create_organization_with_presets("Promotion Org", ["outreach"], owner=owner)

        member = member_add(
            email="promoted@example.com",
            first_name="Promoted",
            last_name="Member",
            middle_name=None,
            organization=org,
            permission_templates=(CASEWORKER, ORG_ADMIN),
        )

        member_roles_replace(organization=org, user_id=member.pk, permission_templates=())

        assert _role_names(org, member) == {ORG_ADMIN.name}

    def test_raises_when_the_user_is_not_a_member(self) -> None:
        owner = baker.make(User)
        org = create_organization_with_presets("Stranger Org", ["outreach"], owner=owner)

        stranger = baker.make(User)

        with pytest.raises(ValidationError, match="not a member"):
            member_roles_replace(organization=org, user_id=stranger.pk, permission_templates=(CASEWORKER,))

    def test_refuses_an_org_bypass_role(self) -> None:
        """Bypass roles are admin-only: this API must never grant one."""
        owner = baker.make(User)
        org = create_organization_with_presets("Guarded Org", ["shelter"], owner=owner)

        member = member_add(
            email="guarded@example.com",
            first_name="Guarded",
            last_name="Member",
            middle_name=None,
            organization=org,
            permission_templates=(SHELTER_OPERATOR,),
        )

        with pytest.raises(ValueError, match="Cannot add roles for"):
            member_roles_replace(organization=org, user_id=member.pk, permission_templates=(GLOBAL_SHELTER_OPERATOR,))

        assert _role_names(org, member) == {SHELTER_OPERATOR.name}


def _role_names(org: Organization, member: User) -> set[str]:
    return set(PermissionGroup.objects.filter(organization=org, user=member).values_list("template__name", flat=True))


# ── create_organization_service: no implicit join ─────────────────────


def _existing_org_with_caseworker() -> tuple[Organization, User]:
    """An organization someone else already runs, with a member holding a role."""
    incumbent = baker.make(User, email="incumbent@example.com")
    org = create_organization_with_presets("Acme Housing", ["outreach"], owner=incumbent, owner_roles=(CASEWORKER,))
    return org, incumbent


@pytest.mark.django_db
def test_creating_an_org_by_an_existing_name_does_not_join_it() -> None:
    org, _ = _existing_org_with_caseworker()
    outsider = baker.make(User, email="outsider@example.com")

    _, created = create_organization_service(user=outsider, organization_name="Acme Housing", org_type_name="shelter")

    assert created.pk != org.pk, "must not resolve onto the existing organization"
    assert not OrganizationUser.objects.filter(user=outsider, organization=org).exists()


@pytest.mark.django_db
def test_creating_an_org_by_an_existing_name_leaves_its_org_types_alone() -> None:
    org, _ = _existing_org_with_caseworker()
    outsider = baker.make(User, email="outsider@example.com")

    create_organization_service(user=outsider, organization_name="Acme Housing", org_type_name="shelter")

    profile = OrganizationProfile.objects.get(organization=org)
    assert [str(org_type) for org_type in profile.org_types] == ["outreach"]


@pytest.mark.django_db
def test_creating_an_org_by_an_existing_name_leaves_its_members_roles_alone() -> None:
    org, incumbent = _existing_org_with_caseworker()
    outsider = baker.make(User, email="outsider@example.com")

    create_organization_service(user=outsider, organization_name="Acme Housing", org_type_name="shelter")

    caseworker = Group.objects.get(permissiongroup__organization=org, permissiongroup__template__name=CASEWORKER.name)
    assert caseworker in incumbent.groups.all()


@pytest.mark.django_db
def test_creating_an_org_by_an_existing_name_grants_no_role_on_it() -> None:
    """The escalation itself: naming someone else's org must not make you its admin."""
    org, _ = _existing_org_with_caseworker()
    outsider = baker.make(User, email="outsider@example.com")

    create_organization_service(user=outsider, organization_name="Acme Housing", org_type_name="shelter")

    held = set(PermissionGroup.objects.filter(organization=org, user=outsider).values_list("template__name", flat=True))
    assert held == set(), f"outsider holds {held} on an organization they never joined"


# ── duplicate organization names are supported ────────────────────────


@pytest.mark.django_db
def test_two_organizations_may_share_a_name() -> None:
    """Pins a deliberate invariant, so nobody "fixes" this with a unique constraint.

    Names are editable and two real organizations may genuinely share one, so
    uniqueness must not be reintroduced — it is the assumption that made
    resolving an organization by name look reasonable in the first place.
    """
    first = create_organization_with_presets("Shared Name", ["outreach"], owner=baker.make(User))
    second = create_organization_with_presets("Shared Name", ["outreach"], owner=baker.make(User))

    assert first.pk != second.pk
    assert first.slug != second.slug, "slug is unique and must absorb the collision"


@pytest.mark.django_db
def test_same_named_organizations_keep_separate_members_and_roles() -> None:
    first_owner = baker.make(User, email="first@example.com")
    second_owner = baker.make(User, email="second@example.com")
    first = create_organization_with_presets("Shared Name", ["outreach"], owner=first_owner, owner_roles=(CASEWORKER,))
    second = create_organization_with_presets(
        "Shared Name", ["outreach"], owner=second_owner, owner_roles=(CASEWORKER,)
    )

    assert not OrganizationUser.objects.filter(user=first_owner, organization=second).exists()
    assert not PermissionGroup.objects.filter(organization=second, user=first_owner).exists()

    first_group = PermissionGroup.objects.get(organization=first, template__name=CASEWORKER.name)
    second_group = PermissionGroup.objects.get(organization=second, template__name=CASEWORKER.name)
    assert first_group.name != second_group.name, "the pk segment must disambiguate"
