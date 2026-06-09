"""
Org-type registry.

Apps register their org-type presets via :meth:`AppConfig.ready()` so the
registry can discover them at startup.  The registry itself is a class so
tests can reset it without mutating global state.
"""

import logging
from dataclasses import dataclass

from common.permissions.config import TemplateConfig  # noqa: TCH001

logger = logging.getLogger(__name__)


class RegistryError(ValueError):
    """Raised when a registration invariant is violated."""


class OrgTypeNotFoundError(RegistryError):
    """Raised when a caller asks for a preset that was never registered."""


# ---------------------------------------------------------------------------
# Org-type preset
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class OrgTypePreset:
    """Everything an org-type needs to be provisioned at creation time.

    .. attribute:: name

        Machine-friendly identifier used as the key in the registry
        (e.g. ``"shelter"``, ``"outreach"``).

    .. attribute:: label

        Human-readable label presented in UI dropdowns.

    .. attribute:: permission_templates

        ``TemplateConfig`` instances that define the permission groups
        created for every organization of this type.

    .. attribute:: invite_body_html

        Template path for the HTML invite email (e.g.
        ``"shelters/email/invite_shelter.html"``).  Falls back to the
        default ``"account/email/email_invite_organization.html"`` when
        ``None``.

    .. attribute:: invite_body_txt

        Template path for the plain-text invite email.  Falls back to
        ``"account/messages/email_invite_organization.txt"`` when
        ``None``.
    """

    name: str
    label: str
    permission_templates: tuple[TemplateConfig, ...] = ()
    invite_body_html: str | None = None
    invite_body_txt: str | None = None


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------


class OrgTypeRegistry:
    """Thread-safe registry of :class:`OrgTypePreset` instances.

    Typical usage::

        # ---- in shelters/apps.py ----
        from accounts.org_type_registry import OrgTypeRegistry, OrgTypePreset

        class SheltersConfig(AppConfig):
            def ready(self):
                registry = OrgTypeRegistry.get()
                registry.register(
                    OrgTypePreset(
                        name="shelter",
                        label="Shelter",
                        permission_templates=(SHELTER_OPERATOR, ORG_ADMIN, ORG_SUPERUSER),
                        invite_body_html="shelters/email/invite_shelter.html",
                        invite_body_txt="shelters/messages/invite_shelter.txt",
                    )
                )

        # ---- anywhere that needs presets ----
        from accounts.org_type_registry import OrgTypeRegistry

        registry = OrgTypeRegistry.get()
        for preset in registry.all():
            print(preset.label)
    """

    _instance: "OrgTypeRegistry | None" = None

    # --- singleton access -----------------------------------------------------------------

    @classmethod
    def get(cls) -> "OrgTypeRegistry":
        """Return (or create) the application-wide singleton."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        """Discard the singleton so the next call to :meth:`get` returns a
        fresh, empty registry.  Useful in test teardown."""
        cls._instance = None

    # --- instance -------------------------------------------------------------------------

    def __init__(self) -> None:
        self._presets: dict[str, OrgTypePreset] = {}

    def register(self, preset: OrgTypePreset) -> None:
        """Add *preset* to the registry.

        Raises :class:`RegistryError` if *preset.name* is already registered.
        All validations happen here, not on :class:`OrgTypePreset`, so
        preset construction is always cheap and testable.
        """
        if not preset.name:
            raise RegistryError("OrgTypePreset name cannot be empty.")

        if not preset.permission_templates:
            raise RegistryError(f"OrgTypePreset '{preset.name}' must declare at least " "one permission template.")

        if preset.name in self._presets:
            raise RegistryError(f"An org-type with name '{preset.name}' is already registered.")

        self._presets[preset.name] = preset
        logger.info("Registered org-type '%s' (%s).", preset.name, preset.label)

    # --- queries --------------------------------------------------------------------------

    def lookup(self, name: str) -> OrgTypePreset:
        """Return the preset registered under *name*.

        Raises :class:`OrgTypeNotFoundError` if *name* is not found.
        """
        try:
            return self._presets[name]
        except KeyError:
            raise OrgTypeNotFoundError(
                f"No org-type preset registered with name '{name}'. " f"Available: {list(self._presets)}"
            ) from None

    def all(self) -> list[OrgTypePreset]:
        """Return all registered presets, ordered by insertion."""
        return list(self._presets.values())

    def names(self) -> list[str]:
        """Return registered preset names (insertion order)."""
        return list(self._presets.keys())

    def __contains__(self, name: str) -> bool:
        return name in self._presets

    def __len__(self) -> int:
        return len(self._presets)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def registry() -> OrgTypeRegistry:
    """Convenience function — returns the current ``OrgTypeRegistry`` singleton."""
    return OrgTypeRegistry.get()
