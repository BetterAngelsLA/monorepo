from common.permissions.utils import perms_to_text_choices
from django.db import models
from django.utils.translation import gettext_lazy as _

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    ClientProfileImportRecord,
    HmisProfile,
    SocialMediaProfile,
)

# ── Model-backed permissions ─────────────────────────────────────────────────

ClientProfilePermissions = perms_to_text_choices(ClientProfile)
ClientContactPermissions = perms_to_text_choices(ClientContact)
ClientHouseholdMemberPermissions = perms_to_text_choices(ClientHouseholdMember)
HmisProfilePermissions = perms_to_text_choices(HmisProfile)
SocialMediaProfilePermissions = perms_to_text_choices(SocialMediaProfile)

# ── Non-BaseModel (no .perms available) ──────────────────────────────────────

class ClientProfileImportRecordPermissions(models.TextChoices):
    VIEW = "clients.view_clientprofileimportrecord", _("Can view client profile import record")
    CHANGE = "clients.change_clientprofileimportrecord", _("Can change client profile import record")
    DELETE = "clients.delete_clientprofileimportrecord", _("Can delete client profile import record")
    ADD = "clients.add_clientprofileimportrecord", _("Can add client profile import record")