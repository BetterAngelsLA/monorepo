"""
Org-type registry — apps register their presets via AppConfig.ready().

Accounts is type-agnostic; it only reads from this registry.
No imports from any domain app (shelters, notes, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class OrgTypePreset:
    label: str
    templates: list[str]
    member_role: str


_presets: dict[str, OrgTypePreset] = {}

_invite_templates: dict[str, dict[str, str]] = {
    "default": {
        "html": "account/email/email_invite_organization.html",
        "txt": "account/messages/email_invite_organization.txt",
    },
}


def register_org_type(key: str, *, label: str, templates: list[str], member_role: str) -> None:
    """Register an org-type preset. Call from AppConfig.ready()."""
    _presets[key] = OrgTypePreset(label=label, templates=templates, member_role=member_role)


def register_invite_template(role_name: str, *, html: str, txt: str) -> None:
    """Register a custom invite email template for a role."""
    _invite_templates[role_name] = {"html": html, "txt": txt}


def get_all_presets() -> dict[str, OrgTypePreset]:
    """Return all registered org-type presets."""
    return _presets


def get_preset(key: str) -> OrgTypePreset:
    """Return a single preset by key. Raises KeyError if not registered."""
    return _presets[key]


def get_invite_templates_for_role(role_name: str) -> dict[str, str]:
    """Return invite email template paths for a given role name.

    Falls back to the 'default' templates if the role has no specific entry.
    """
    return _invite_templates.get(role_name, _invite_templates["default"])
