"""
Central registry of all permission templates and org types.

This is the single source of truth for:
* which org types exist and what label they use
* which templates (roles) each org type supports
* which invite email template each role uses

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

    def __post_init__(self) -> None:
        by_name: dict[str, OrgTypeConfig] = {}
        templates: dict[str, TemplateConfig] = {}
        for oc in (self.outreach, self.shelter):
            by_name[oc.name] = oc
            for tc in oc.templates:
                templates[tc.name] = tc
        object.__setattr__(self, "_by_name", by_name)
        object.__setattr__(self, "_templates_by_name", templates)

    # ── Queries ────────────────────────────────────────────────────────

    def org_type(self, name: str) -> OrgTypeConfig | None:
        """Return the ``OrgTypeConfig`` for *name* or ``None``."""
        return self._by_name.get(name)

    def template(self, name: str) -> TemplateConfig | None:
        """Return the ``TemplateConfig`` for *name* or ``None``."""
        return self._templates_by_name.get(name)

    def template_names_for(self, org: Organization) -> list[str]:
        """All template names available for *org*, based on ``profile.org_types``."""
        org_types = org.profile.org_types if hasattr(org, "profile") else []
        names: list[str] = []
        for ot in org_types:
            oc = self._by_name.get(ot.value)
            if oc:
                names.extend(tc.name for tc in oc.templates)
        return sorted(set(names))


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------

REGISTRY = Registry(
    outreach=OrgTypeConfig(
        name="outreach",
        label="Outreach",
        templates=(CASEWORKER, ORG_ADMIN, ORG_SUPERUSER),
    ),
    shelter=OrgTypeConfig(
        name="shelter",
        label="Shelter",
        templates=(SHELTER_OPERATOR, ORG_ADMIN, ORG_SUPERUSER),
    ),
)
