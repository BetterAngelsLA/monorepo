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
    bypasses_org_scoping: bool = False
    """Whether holders of this role bypass organization scoping in permission checks.

    A ``PermissionGroup`` is always tied to one organization, but a role marked
    ``True`` here (e.g. Global Shelter Operator) grants access across every
    organization for the permissions it holds — regardless of which one
    organization its ``PermissionGroup`` happens to live under. See
    :func:`common.permissions.utils.user_holds_org_bypass_perms`.

    Only set this for roles that are genuinely meant to be org-independent.
    Every permission on such a role's list is implicitly cross-org for any
    check that goes through :func:`~common.permissions.utils.permissioned_queryset`
    or :class:`~accounts.extensions.HasOrgPerm`."""
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
