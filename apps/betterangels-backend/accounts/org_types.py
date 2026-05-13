"""
Org-type helpers — reads from ``settings.ORG_TYPE_PRESETS`` and ``settings.INVITE_TEMPLATES``.

Provides typed access to the org-type configuration defined in settings.
No imports from any domain app (shelters, reports, etc.).
"""

from __future__ import annotations

from django.conf import settings


def get_preset_config(preset_key: str) -> dict:
    """Return the preset config dict for *preset_key*. Raises KeyError if not found."""
    return settings.ORG_TYPE_PRESETS[preset_key]


def get_invite_templates_for_role(role_name: str) -> dict[str, str]:
    """Return invite email template paths for a given role name.

    Falls back to the 'default' templates if the role has no specific entry.
    """
    return settings.INVITE_TEMPLATES.get(role_name, settings.INVITE_TEMPLATES["default"])


def is_member_role(template_name: str) -> bool:
    """Return True if *template_name* is the primary member role for any preset."""
    return any(cfg["member_role"] == template_name for cfg in settings.ORG_TYPE_PRESETS.values())
