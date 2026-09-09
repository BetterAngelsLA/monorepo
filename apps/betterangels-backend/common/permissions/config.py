from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class TemplateConfig:
    """Configuration for a PermissionGroupTemplate.

    Binds a template name to its permission list so they can't drift apart.
    """

    name: str
    permissions: list[str] = field(default_factory=list)
    is_invitable: bool = True
    """Whether a user can be invited directly into this role.

    Set ``False`` for promotion-only roles (e.g. Org Admin, Org Superuser)."""
    invite_html: str | None = None
    """Path to the HTML invitation email template.

    Required when ``is_invitable`` is ``True``.  The template receives
    ``invitee_email``, ``organization_name``, ``invited_by_name``, and
    ``accept_url`` in its context."""
    invite_txt: str | None = None
    """Path to the plain-text invitation email template.

    Required when ``is_invitable`` is ``True``."""
    welcome_html: str | None = None
    """Path to the HTML welcome email template for self-signup flows.

    Used instead of ``invite_html`` when a user creates their own
    organization (no inviter).  The template receives ``user_email``,
    ``organization_name``, and ``user_first_name`` in its context."""
    welcome_txt: str | None = None
    """Path to the plain-text welcome email template for self-signup flows."""
    base_url_setting: str = ""
    """Name of the Django setting that holds the base URL of the
    frontend app for this role (e.g. ``"SHELTER_WEB_BASE_URL"``).
    ``send_welcome_email`` reads this setting and passes it to the
    welcome template as ``{{ base_url }}``; the template appends its
    own dashboard path (e.g. ``/operator``)."""


@dataclass(frozen=True)
class RoleDef:
    """Code-owned definition of a ``Role`` (ADR 0001 §2.2).

    ``is_global=True`` roles are held directly in ``user.groups`` — the global
    tier, read through Django's ``has_perm``.  ``is_global=False`` roles are
    granted through ``Grant`` rows and are always scoped to an organization.

    Provisioned by :func:`accounts.services.sync_roles`; the flag is never
    flipped by hand (checks ``permissions.E001`` / ``permissions.E002``).
    """

    name: str
    permissions: list[str] = field(default_factory=list)
    is_global: bool = False
    is_invitable: bool = True
    invite_html: str | None = None
    invite_txt: str | None = None
    welcome_html: str | None = None
    welcome_txt: str | None = None
    base_url_setting: str = ""

    @classmethod
    def from_template(cls, template: TemplateConfig, *, is_global: bool = False) -> "RoleDef":
        """Build a ``RoleDef`` from the legacy ``TemplateConfig`` it replaces."""
        return cls(
            name=template.name,
            # Copy so a future in-place mutation of one list never aliases the
            # other definition (the dataclass is frozen, the list is not).
            permissions=list(template.permissions),
            is_global=is_global,
            is_invitable=template.is_invitable,
            invite_html=template.invite_html,
            invite_txt=template.invite_txt,
            welcome_html=template.welcome_html,
            welcome_txt=template.welcome_txt,
            base_url_setting=template.base_url_setting,
        )


# Models that may carry object grants (ADR 0001 §2.5), keyed "app_label.model".
# Empty until the object-grant arm is wired at the clients cutover: a grant to a
# model outside this set is refused at write time (``Grant.clean``) and flagged at
# deploy time (``permissions.E003``).  One source, so the two gates cannot drift
# apart — the cutover adds models here and both open together.
OBJECT_GRANT_WHITELIST: frozenset[str] = frozenset()


def content_type_key(content_type: Any) -> str:
    """The whitelist key for a ``ContentType`` (or any ``app_label``/``model`` holder)."""
    return f"{content_type.app_label}.{content_type.model}"
