"""Test helpers for creating orgs via the service layer."""

from typing import Any

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.services import create_organization_with_presets
from model_bakery import baker
from notes.groups import CASEWORKER
from organizations.models import Organization


def make_org_with_presets(**attrs: Any) -> Organization:
    """Create an organization through create_organization_with_presets.

    Generates an owner and sensible defaults if not provided, then
    delegates to the service function so that permission groups,
    profile, and owner role assignment all happen correctly.

    Keyword Arguments:
        name: Organization name (auto-generated if omitted).
        preset_names: List of org-type preset names (default: ``["outreach"]``).
        owner: The owning User (auto-generated via ``baker.make`` if omitted).
        owner_roles: Tuple of TemplateConfig roles for the owner
            (default: ``(CASEWORKER, ORG_ADMIN)``).
    """
    owner = attrs.pop("owner", None) or baker.make(User)
    name = attrs.pop("name", "Test Org " + baker.random_gen.gen_string(8))
    preset_names = attrs.pop("preset_names", ["outreach"])
    owner_roles = attrs.pop("owner_roles", (CASEWORKER, ORG_ADMIN))

    return create_organization_with_presets(
        name=name,
        preset_names=preset_names,
        owner=owner,
        owner_roles=owner_roles,
    )
