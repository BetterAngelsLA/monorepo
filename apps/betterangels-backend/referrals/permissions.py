from common.permissions.utils import perms_to_text_choices

from .models import Referral

# ── Model-backed permission enum ──────────────────────────────────────────────
# This TextChoices class exists solely to register with Strawberry's GraphQL
# type system (schema introspection, make_granted_permissions, etc.).
#
# For IDE autocomplete, use the model's .perms:
#     Referral.perms.VIEW    → "referrals.view_referral"
# ──────────────────────────────────────────────────────────────────────────────

ReferralPermissions = perms_to_text_choices(Referral)
