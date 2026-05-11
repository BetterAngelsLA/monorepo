"""
Org-type registry — allows domain apps to register their configuration
without accounts needing to import from them.

Each app calls ``register_org_type()`` in its ``AppConfig.ready()`` to declare:
  - which permission-group templates to create for new orgs of that type
  - which template is the default member role
  - which email templates to use for invitations

This keeps shelter/outreach knowledge out of accounts while letting accounts
remain the single authority for org-type infrastructure.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from accounts.enums import OrgType
from accounts.groups import GroupTemplateNames


@dataclass(frozen=True)
class OrgTypeConfig:
    """Configuration for a single org type."""

    templates: list[str]
    member_role: str
    invite_templates: dict[str, str] = field(default_factory=dict)


# Private mutable registry — populated at startup via register_org_type().
_registry: dict[str, OrgTypeConfig] = {}


def register_org_type(org_type: str, config: OrgTypeConfig) -> None:
    """Register configuration for an org type.  Called from AppConfig.ready()."""
    _registry[org_type] = config


def get_org_type_config(org_type: str) -> OrgTypeConfig:
    """Return the config for *org_type*, falling back to OUTREACH."""
    return _registry.get(org_type, _registry[OrgType.OUTREACH])


def get_all_configs() -> dict[str, OrgTypeConfig]:
    """Return the full registry (read-only snapshot)."""
    return dict(_registry)


def get_invite_templates(org_type: str) -> dict[str, str]:
    """Return invite email template paths for *org_type*."""
    cfg = get_org_type_config(org_type)
    return cfg.invite_templates


def is_registered_member_role(template_name: str) -> bool:
    """Return True if *template_name* is the primary member template for any registered org type."""
    return any(cfg.member_role == template_name for cfg in _registry.values())
