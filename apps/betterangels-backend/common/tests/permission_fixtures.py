"""Shared fixtures for the organization-scoping tests."""

from types import SimpleNamespace
from typing import Any, Optional

from accounts.models import User
from django.contrib.auth.models import Permission
from model_bakery import baker


def stub_info(user: Optional[User] = None, organization_id: Any = None) -> Any:
    """Minimum shape the org-scoping code reads: ``info.context.request``."""
    return SimpleNamespace(
        context=SimpleNamespace(
            request=SimpleNamespace(user=user, organization_id=organization_id),
        )
    )


def user_with_global_perm(perm: str) -> User:
    """A user holding *perm* model-wide, the way the guardian fallback grants it."""
    app_label, codename = perm.split(".", 1)
    user = baker.make(User, is_active=True)
    user.user_permissions.add(
        Permission.objects.get(content_type__app_label=app_label, codename=codename),
    )
    return user
