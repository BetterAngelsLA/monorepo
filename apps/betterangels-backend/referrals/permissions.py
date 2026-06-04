from django.db import models
from django.utils.translation import gettext_lazy as _


class ReferralPermissions(models.TextChoices):
    VIEW = "referrals.view_referral", _("Can view referral")
    CHANGE = "referrals.change_referral", _("Can change referral")
    DELETE = "referrals.delete_referral", _("Can delete referral")
    ADD = "referrals.add_referral", _("Can add referral")
