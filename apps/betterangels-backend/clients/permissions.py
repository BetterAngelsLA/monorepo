from common.permissions.utils import register_permission
from django.db import models
from django.utils.translation import gettext_lazy as _

# ── Model-backed permission enums ───────────────────────────────────────────
# For IDE autocomplete, use the model's .perms:
#     ClientProfile.perms.VIEW     → "clients.view_clientprofile"

@register_permission
class ClientProfilePermissions(models.TextChoices):
    VIEW = "clients.view_clientprofile", _("Can view client profile")
    ADD = "clients.add_clientprofile", _("Can add client profile")
    CHANGE = "clients.change_clientprofile", _("Can change client profile")
    DELETE = "clients.delete_clientprofile", _("Can delete client profile")

@register_permission
class ClientContactPermissions(models.TextChoices):
    VIEW = "clients.view_clientcontact", _("Can view client contact")
    ADD = "clients.add_clientcontact", _("Can add client contact")
    CHANGE = "clients.change_clientcontact", _("Can change client contact")
    DELETE = "clients.delete_clientcontact", _("Can delete client contact")

@register_permission
class ClientHouseholdMemberPermissions(models.TextChoices):
    VIEW = "clients.view_clienthouseholdmember", _("Can view client household member")
    ADD = "clients.add_clienthouseholdmember", _("Can add client household member")
    CHANGE = "clients.change_clienthouseholdmember", _("Can change client household member")
    DELETE = "clients.delete_clienthouseholdmember", _("Can delete client household member")

@register_permission
class HmisProfilePermissions(models.TextChoices):
    VIEW = "clients.view_hmisprofile", _("Can view HMIS profile")
    ADD = "clients.add_hmisprofile", _("Can add HMIS profile")
    CHANGE = "clients.change_hmisprofile", _("Can change HMIS profile")
    DELETE = "clients.delete_hmisprofile", _("Can delete HMIS profile")

@register_permission
class SocialMediaProfilePermissions(models.TextChoices):
    VIEW = "clients.view_socialmediaprofile", _("Can view social media profile")
    ADD = "clients.add_socialmediaprofile", _("Can add social media profile")
    CHANGE = "clients.change_socialmediaprofile", _("Can change social media profile")
    DELETE = "clients.delete_socialmediaprofile", _("Can delete social media profile")

@register_permission
class ClientProfileImportRecordPermissions(models.TextChoices):
    VIEW = "clients.view_clientprofileimportrecord", _("Can view client profile import record")
    CHANGE = "clients.change_clientprofileimportrecord", _("Can change client profile import record")
    DELETE = "clients.delete_clientprofileimportrecord", _("Can delete client profile import record")
    ADD = "clients.add_clientprofileimportrecord", _("Can add client profile import record")
