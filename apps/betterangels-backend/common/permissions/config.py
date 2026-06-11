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
