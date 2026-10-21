"""Referral permission capability for the role templates.

The referrals app owns its slice of the role bundle; ``notes.groups`` composes
this list instead of reaching into ``referrals.models`` itself.  Only the
Caseworker template carries the capability today — ``ffReferrals`` decides which
teams actually get the feature (waffle flags scope to users and groups), so the
other role bundles stay untouched until a pilot needs them.
"""

from referrals.models import Referral

REFERRAL_CASEWORKER_PERMISSIONS = (
    Referral.perms.ADD,
    Referral.perms.CHANGE,
    Referral.perms.VIEW,
)
