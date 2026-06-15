from dataclasses import dataclass, field


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
