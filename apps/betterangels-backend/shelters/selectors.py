"""
Shelter selectors — single source of truth for queryset filtering.

Selectors apply domain filters to an existing queryset.  Both custom
managers (``managers.py``) and Strawberry ``get_queryset`` hooks
(``types.py``) delegate here so the filtering logic is defined once.
"""

from typing import TYPE_CHECKING

from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization
from shelters.enums import StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter


def shelter_list(queryset: "QuerySet[Shelter]") -> "QuerySet[Shelter]":
    """Filter to shelters approved for public display."""
    return queryset.filter(status=StatusChoices.APPROVED)


def admin_shelter_list(queryset: "QuerySet[Shelter]", *, user: "User") -> "QuerySet[Shelter]":
    """Filter to shelters whose organization the *user* belongs to."""
    user_orgs = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
    return queryset.filter(Exists(user_orgs))
