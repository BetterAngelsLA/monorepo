"""
Org-type helpers — reads from ``settings.ORG_TYPE_CONFIGS``.

Provides typed access to the org-type configuration defined in settings.
No imports from any domain app (shelters, reports, etc.).
"""

from __future__ import annotations

from django.conf import settings


def get_org_type_config(org_type: str) -> dict:
    """Return the config dict for *org_type*, falling back to DEFAULT_ORG_TYPE."""
    return settings.ORG_TYPE_CONFIGS.get(
        org_type,
        settings.ORG_TYPE_CONFIGS[settings.DEFAULT_ORG_TYPE],
    )


def get_invite_templates(org_type: str) -> dict[str, str]:
    """Return invite email template paths for *org_type*."""
    return get_org_type_config(org_type).get("invite_templates", {})


def is_default_member_role(template_name: str) -> bool:
    """Return True if *template_name* is the primary member role for any org type."""
    return any(cfg["member_role"] == template_name for cfg in settings.ORG_TYPE_CONFIGS.values())
