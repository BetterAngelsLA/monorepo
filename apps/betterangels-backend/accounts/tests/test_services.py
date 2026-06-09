"""Tests for accounts.services."""

import pytest
from accounts.models import OrganizationProfile, PermissionGroup
from accounts.services import (
    create_organization_with_presets,
    get_member_permission_group,
)
from django.test import TestCase


class TestCreateOrganizationWithPresets(TestCase):
    """Integration tests for create_organization_with_presets."""

    def setUp(self) -> None:
        from accounts.org_type_registry import OrgTypeRegistry

        OrgTypeRegistry.reset()
        self._register_presets()

    @staticmethod
    def _register_presets() -> None:
        from accounts.org_type_registry import OrgTypePreset, OrgTypeRegistry
        from common.permissions.config import TemplateConfig

        r = OrgTypeRegistry.get()
        r.register(
            OrgTypePreset(
                name="outreach",
                label="Outreach",
                permission_templates=(
                    TemplateConfig(name="Caseworker", permissions=["notes.add_note"]),
                    TemplateConfig(name="Organization Admin", permissions=["org.access"]),
                    TemplateConfig(name="Organization Superuser", permissions=["org.super"]),
                ),
            )
        )
        r.register(
            OrgTypePreset(
                name="shelter",
                label="Shelter",
                permission_templates=(
                    TemplateConfig(name="Shelter Operator", permissions=["shelters.view_shelter"]),
                    TemplateConfig(name="Organization Admin", permissions=["org.access"]),
                    TemplateConfig(name="Organization Superuser", permissions=["org.super"]),
                ),
            )
        )

    def test_create_outreach_org(self) -> None:
        org = create_organization_with_presets(
            name="Test Outreach",
            preset_names=["outreach"],
        )
        assert org.name == "Test Outreach"

        # Profile
        profile = OrganizationProfile.objects.get(organization=org)
        assert [t.value for t in profile.org_types] == ["outreach"]

        # Permission groups
        pg_names = set(PermissionGroup.objects.filter(organization=org).values_list("template__name", flat=True))
        assert pg_names == {"Caseworker", "Organization Admin", "Organization Superuser"}

    def test_create_shelter_org(self) -> None:
        org = create_organization_with_presets(
            name="Test Shelter",
            preset_names=["shelter"],
        )
        profile = OrganizationProfile.objects.get(organization=org)
        assert [t.value for t in profile.org_types] == ["shelter"]

        pg_names = set(PermissionGroup.objects.filter(organization=org).values_list("template__name", flat=True))
        assert pg_names == {"Shelter Operator", "Organization Admin", "Organization Superuser"}

    def test_create_dual_type_org(self) -> None:
        """Multi-type org: outreach + shelter."""
        org = create_organization_with_presets(
            name="Dual Org",
            preset_names=["outreach", "shelter"],
        )
        profile = OrganizationProfile.objects.get(organization=org)
        assert sorted(t.value for t in profile.org_types) == ["outreach", "shelter"]

        pg_names = set(PermissionGroup.objects.filter(organization=org).values_list("template__name", flat=True))
        # Shared templates (Org Admin, Org Superuser) are de-duplicated by get_or_create
        assert "Caseworker" in pg_names
        assert "Shelter Operator" in pg_names
        assert "Organization Admin" in pg_names
        assert "Organization Superuser" in pg_names
        assert PermissionGroup.objects.filter(organization=org).count() == 4


class TestGetMemberPermissionGroup(TestCase):
    """Tests for get_member_permission_group."""

    def setUp(self) -> None:
        from accounts.org_type_registry import OrgTypeRegistry

        OrgTypeRegistry.reset()
        TestCreateOrganizationWithPresets._register_presets()

    def test_returns_first_template_group(self) -> None:
        org = create_organization_with_presets(name="M", preset_names=["shelter"])
        member_pg = get_member_permission_group(org)
        assert member_pg.template.name == "Shelter Operator"

    def test_missing_org_types_raises(self) -> None:
        from organizations.models import Organization

        org = Organization.objects.create(name="No Types")
        OrganizationProfile.objects.create(organization=org, org_types=[])

        with pytest.raises(ValueError, match="no org_types"):
            get_member_permission_group(org)
