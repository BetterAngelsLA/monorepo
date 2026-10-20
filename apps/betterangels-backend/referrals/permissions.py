"""Referral permission contributions for the role templates.

The referrals app owns its slice of each role's permission bundle; the role
templates in ``notes``/``accounts``/``shelters`` compose these lists instead of
reaching into ``referrals.models`` themselves.  That keeps referral policy
(which roles may read/add/change/delete a referral) next to the referral model
while leaving the role bundles as the single place that lists a role's access.
"""

from referrals.models import Referral

REFERRAL_CASEWORKER_PERMISSIONS = (
    Referral.perms.ADD,
    Referral.perms.CHANGE,
    Referral.perms.VIEW,
)

REFERRAL_ORG_ADMIN_PERMISSIONS = (
    *REFERRAL_CASEWORKER_PERMISSIONS,
    Referral.perms.DELETE,
)

REFERRAL_SHELTER_OPERATOR_PERMISSIONS = (Referral.perms.VIEW,)
