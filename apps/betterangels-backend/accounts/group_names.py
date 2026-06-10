from enum import StrEnum


class GroupTemplateNames(StrEnum):
    """Registry of permission group template name strings.

    NOTE: This enum is intentionally thin — it exists only to provide
    type-safe lookups for template names.  Over time each app should
    register its own template names independently so that ``accounts``
    doesn't need to know about downstream apps (``shelters``,
    ``notes``, etc.).
    """

    CASEWORKER = "Caseworker"
    ORG_ADMIN = "Organization Admin"
    ORG_SUPERUSER = "Organization Superuser"
