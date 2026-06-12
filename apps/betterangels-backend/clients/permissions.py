from common.permissions.utils import permissions_enum_from_model
from django.db import models
from django.utils.translation import gettext_lazy as _

from .models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    SocialMediaProfile,
)

# ── Model-backed permission enums ─────────────────────────────────────────────
# These TextChoices classes exist solely to register types with Strawberry's
# GraphQL type system (schema introspection, make_granted_permissions, etc.).
#
# For IDE autocomplete on individual permission values, use the model's .perms:
#     ClientProfile.perms.VIEW     → "clients.view_clientprofile"
# ──────────────────────────────────────────────────────────────────────────────

ClientProfilePermissions = permissions_enum_from_model(ClientProfile)
ClientContactPermissions = permissions_enum_from_model(ClientContact)
ClientHouseholdMemberPermissions = permissions_enum_from_model(ClientHouseholdMember)
HmisProfilePermissions = permissions_enum_from_model(HmisProfile)
SocialMediaProfilePermissions = permissions_enum_from_model(SocialMediaProfile)


# ── Non-BaseModel (no .perms available) ──────────────────────────────────────


class ClientProfileImportRecordPermissions(models.TextChoices):
    VIEW = "clients.view_clientprofileimportrecord", _("Can view client profile import record")
    CHANGE = "clients.change_clientprofileimportrecord", _("Can change client profile import record")
    DELETE = "clients.delete_clientprofileimportrecord", _("Can delete client profile import record")
    ADD = "clients.add_clientprofileimportrecord", _("Can add client profile import record")
