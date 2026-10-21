"""Domain permission predicates for shelters (ADR 0001 §2.4).

Predicates that belong to the shelters domain but are consumed from more than one
layer — the GraphQL output fields and the filters — so they cannot live in either
without a circular import (``types/outputs.py`` imports ``types/filters.py``).
"""

from typing import TYPE_CHECKING, cast

from strawberry import Info
from strawberry_django.auth.utils import get_current_user

from common.permissions.selectors import can_globally
from shelters.models import ContactInfo, Shelter

if TYPE_CHECKING:
    from accounts.models import User

# The singular source for the BA-review fields: the write gate, the read gate,
# and the audit log's redaction all use this list so a new field cannot be gated
# in one place and omitted in another (ADR 0001 §2.4, ADR 0004 §18).
BA_REVIEW_FIELDS = ("overall_rating", "subjective_review", "declined_ba_visit")


def can_view_ba_review(info: Info) -> bool:
    """Whether the request user may read the BA-review fields.

    Covers ``overall_rating`` / ``subjective_review`` / ``declined_ba_visit`` and
    filtering on them.  BA review is a global-tier domain, like additional
    contacts (ADR 0001 §2.4).

    ``change`` implies ``view``: a role trusted to edit the review must also be
    able to read it, otherwise it would write blind.
    """
    user = get_current_user(info)
    if user is None or not user.is_authenticated:
        return False

    reviewer = cast("User", user)
    return can_globally(reviewer, Shelter.perms.VIEW_BA_REVIEW) or can_globally(
        reviewer, Shelter.perms.CHANGE_BA_REVIEW
    )


def can_change_ba_review(user: "User") -> bool:
    """Whether *user* may edit the BA-review fields — the write arm of the gate.

    Takes the user rather than ``Info`` because the callers are services, which
    have no GraphQL context.  Global tier only: a scoped Grant never authorizes a
    review edit (ADR 0001 §2.4).
    """
    return can_globally(user, Shelter.perms.CHANGE_BA_REVIEW)


def can_view_additional_contacts(info: Info) -> bool:
    """Whether the request user may read a shelter's additional contacts.

    BA-only and global tier — never a scoped Grant (ADR 0001 §2.4).  Note this is
    ``ContactInfo.perms.VIEW``, a separate grant from the shelter read itself.
    """
    user = get_current_user(info)
    if user is None or not user.is_authenticated:
        return False

    return can_globally(cast("User", user), ContactInfo.perms.VIEW)
