"""
Org-type configuration — a plain mapping from OrgType to its defaults.

Each entry declares:
  - which permission-group templates to create for new orgs of that type
  - which template is the default member role
  - which email templates to use for invitations

Shelter-specific constants are imported here so the configuration lives in
one place.  The dependency direction (accounts → shelters.groups for a
constant) is acceptable because this is static data, not runtime logic.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from accounts.enums import OrgType
from accounts.groups import GroupTemplateNames
from shelters.groups import SHELTER_OPERATOR


@dataclass(frozen=True)
class OrgTypeConfig:
    """Configuration for a single org type."""

    templates: list[str]
    member_role: str
    invite_templates: dict[str, str] = field(default_factory=dict)


ORG_TYPE_CONFIGS: dict[str, OrgTypeConfig] = {
    OrgType.OUTREACH: OrgTypeConfig(
        templates=[
            GroupTemplateNames.CASEWORKER,
            GroupTemplateNames.ORG_ADMIN,
            GroupTemplateNames.ORG_SUPERUSER,
        ],
        member_role=GroupTemplateNames.CASEWORKER,
        invite_templates={
            "html": "account/email/email_invite_organization.html",
            "txt": "account/messages/email_invite_organization.txt",
        },
    ),
    OrgType.SHELTER: OrgTypeConfig(
        templates=[
            SHELTER_OPERATOR,
            GroupTemplateNames.ORG_ADMIN,
            GroupTemplateNames.ORG_SUPERUSER,
        ],
        member_role=SHELTER_OPERATOR,
        invite_templates={
            "html": "account/email/shelter_operator_invite.html",
            "txt": "account/messages/shelter_operator_invite.txt",
        },
    ),
}


def get_org_type_config(org_type: str) -> OrgTypeConfig:
    """Return the config for *org_type*, falling back to OUTREACH."""
    return ORG_TYPE_CONFIGS.get(org_type, ORG_TYPE_CONFIGS[OrgType.OUTREACH])


def get_invite_templates(org_type: str) -> dict[str, str]:
    """Return invite email template paths for *org_type*."""
    return get_org_type_config(org_type).invite_templates


def is_default_member_role(template_name: str) -> bool:
    """Return True if *template_name* is the primary member template for any org type."""
    return any(cfg.member_role == template_name for cfg in ORG_TYPE_CONFIGS.values())
