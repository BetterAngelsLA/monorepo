"""Referral permission capability for the role templates.

The referrals app owns its slice of the role bundle; ``notes.groups`` composes
this list instead of reaching into ``referrals.models`` itself.  Only the
Caseworker template carries the capability today — the API additionally
requires :data:`REFERRALS_FLAG` to be active for the caller, and the flag's
waffle scoping (users and groups) decides which teams actually get the feature,
so the other role bundles stay untouched until a pilot needs them.
"""

from referrals.models import Referral

REFERRALS_FLAG = "ffReferrals"

REFERRAL_CASEWORKER_PERMISSIONS = (
    Referral.perms.ADD,
    Referral.perms.CHANGE,
    Referral.perms.VIEW,
)
