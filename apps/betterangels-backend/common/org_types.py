"""Shared registry of all permission templates and org types.

This is the single source of truth for:
* which org types exist and what label they use
* which templates (roles) each org type supports

Every ``TemplateConfig`` defined in an app's ``groups.py`` must be listed
here under its org type.  No ``ready()`` side-effects needed.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from accounts.groups import ORG_ADMIN, ORG_SUPERUSER
from common.permissions.config import TemplateConfig
from notes.groups import CASEWORKER
from shelters.groups import SHELTER_OPERATOR

if TYPE_CHECKING:
    from organizations.models import Organization

# ---------------------------------------------------------------------------
# Configuration types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class OrgTypeConfig:
    """Configuration for one organization type."""

    name: str  # "outreach"
    label: str  # "Outreach"
    templates: tuple[TemplateConfig, ...]  # (CASEWORKER, ORG_ADMIN, ORG_SUPERUSER)
    member_template: TemplateConfig
    """The member-level role template (e.g. Caseworker, Shelter Operator).

    This is the default role assigned to new members and the role used
    for self-signup flows.  It must be one of the entries in *templates*
    and must be invitable (``is_invitable=True``).
    """
    allow_public_signup: bool = False
    """Whether this org type supports public self-signup (e.g., shelter operator onboarding)."""


@dataclass(frozen=True)
class Registry:
    """All org types and templates.  Named fields for type-safe access.

    Internal string-keyed indices are built automatically in
    ``__post_init__`` for O(1) lookup.
    """

    outreach: OrgTypeConfig
    shelter: OrgTypeConfig

    _by_name: dict[str, OrgTypeConfig] = field(init=False, repr=False)
    _templates_by_name: dict[str, TemplateConfig] = field(init=False, repr=False)
    _invitable_templates_by_name: dict[str, TemplateConfig] = field(init=False, repr=False)

    def __post_init__(self) -> None:
        by_name: dict[str, OrgTypeConfig] = {}
        templates_by_name: dict[str, TemplateConfig] = {}
        invitable_templates_by_name: dict[str, TemplateConfig] = {}
        for org_config in (self.outreach, self.shelter):
            by_name[org_config.name] = org_config
            for template_config in org_config.templates:
                templates_by_name[template_config.name] = template_config
                if template_config.is_invitable:
                    invitable_templates_by_name[template_config.name] = template_config
        object.__setattr__(self, "_by_name", by_name)
        object.__setattr__(self, "_templates_by_name", templates_by_name)
        object.__setattr__(self, "_invitable_templates_by_name", invitable_templates_by_name)

    # ── Queries ────────────────────────────────────────────────────────

    def org_type(self, name: str) -> OrgTypeConfig | None:
        """Return the ``OrgTypeConfig`` for *name* or ``None``."""
        return self._by_name.get(name)

    def template(self, name: str) -> TemplateConfig | None:
        """Return the ``TemplateConfig`` for *name* or ``None``."""
        return self._templates_by_name.get(name)

    def org_type_names(self) -> list[str]:
        """Return all registered org type names (e.g. "outreach", "shelter")."""
        return sorted(self._by_name.keys())

    def template_names(self) -> list[str]:
        """Return all registered template names (e.g. "Caseworker", "Shelter Operator")."""
        return sorted(self._templates_by_name.keys())

    def template_names_for(self, org: Organization) -> list[str]:
        """All template names available for *org*, based on ``profile.org_types``."""
        org_types = org.profile.org_types if hasattr(org, "profile") else []
        names: list[str] = []
        for org_type in org_types:
            org_config = self._by_name.get(org_type.value)
            if org_config:
                names.extend(template_config.name for template_config in org_config.templates)
        return sorted(set(names))

    def invitable_template_names(self) -> list[str]:
        """Return invitable-only template names (is_invitable=True)."""
        return sorted(self._invitable_templates_by_name.keys())

    def get_template_or_raise(self, name: str, org: Organization) -> TemplateConfig:
        """Look up a template by *name* and raise ``ValidationError`` if not found for *org*.

        DRY helper for mutations that accept a ``permission_template`` input
        and need to validate it against the org's available invitable templates.
        """
        from django.core.exceptions import ValidationError

        template = self.template(name)
        if template is None:
            valid = self.invitable_template_names_for(org)
            raise ValidationError(f"Invalid permission template '{name}'. Available: {', '.join(valid)}")
        return template

    def invitable_template_names_for(self, org: Organization) -> list[str]:
        """Invitable template names available for *org*, based on ``profile.org_types``."""
        org_types = org.profile.org_types if hasattr(org, "profile") else []
        names: list[str] = []
        for org_type in org_types:
            org_config = self._by_name.get(org_type.value)
            if org_config:
                names.extend(
                    template_config.name for template_config in org_config.templates if template_config.is_invitable
                )
        return sorted(set(names))

    # ── Typed query methods ─────────────────────────────────────────────

    def templates_for(self, org: Organization) -> list[TemplateConfig]:
        """Return the full ``TemplateConfig`` objects for *org*.

        Used by utilities that need the complete config (permissions,
        invite paths, etc.) rather than just the template name.
        """
        org_types = org.profile.org_types if hasattr(org, "profile") else []
        result: list[TemplateConfig] = []
        seen: set[str] = set()
        for org_type in org_types:
            org_config = self._by_name.get(org_type.value)
            if org_config:
                for template_config in org_config.templates:
                    if template_config.name not in seen:
                        seen.add(template_config.name)
                        result.append(template_config)
        return result

    def invitable_templates_for(self, org: Organization) -> list[TemplateConfig]:
        """Return the invitable ``TemplateConfig`` objects for *org*."""
        return [t for t in self.templates_for(org) if t.is_invitable]

    # ── Invite email template ───────────────────────────────────────────

    def invite_template(self, template: TemplateConfig) -> dict[str, str]:
        """Return ``{html, txt}`` template paths for *template*.

        Raises ``ValueError`` if the template is invitable but has no
        ``invite_html`` or ``invite_txt`` defined — every invitable
        role must explicitly specify its invite email templates.
        """
        if template.invite_html and template.invite_txt:
            return {"html": template.invite_html, "txt": template.invite_txt}
        raise ValueError(f"Template '{template.name}' is invitable but has no invite_html/invite_txt.")


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

REGISTRY = Registry(
    outreach=OrgTypeConfig(
        name="outreach",
        label="Outreach",
        templates=(CASEWORKER, ORG_ADMIN, ORG_SUPERUSER),
        member_template=CASEWORKER,
    ),
    shelter=OrgTypeConfig(
        name="shelter",
        label="Shelter",
        templates=(SHELTER_OPERATOR, ORG_ADMIN, ORG_SUPERUSER),
        member_template=SHELTER_OPERATOR,
        allow_public_signup=True,
    ),
)
