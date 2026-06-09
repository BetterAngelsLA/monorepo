from common.permissions.utils import model_permissions

from .models import Referral

# ── Model-backed permission enum ──────────────────────────────────────────────
# This TextChoices class exists solely to register with Strawberry's GraphQL
# type system (schema introspection, make_granted_permissions, etc.).
#
# For IDE autocomplete, use the model's .perms:
#     Referral.perms.VIEW    → "referrals.view_referral"
# ──────────────────────────────────────────────────────────────────────────────

ReferralPermissions = model_permissions(Referral)
