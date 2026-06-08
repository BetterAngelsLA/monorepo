from common.permissions.utils import perms_to_text_choices

from .models import Referral

ReferralPermissions = perms_to_text_choices(Referral)