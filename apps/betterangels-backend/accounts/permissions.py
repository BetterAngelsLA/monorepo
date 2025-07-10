from django.db import models
from django.utils.translation import gettext_lazy as _


class OrganizationPortalPermissions(models.TextChoices):
    ACCESS_ORG_PORTAL = "organizations.access_org_portal", _("Can access organization management portal")
    ADD_ORG_MEMBER = "organizations.add_org_member", _("Can add organization member")
    REMOVE_ORG_MEMBER = "organizations.remove_org_member", _("Can remove organization member")
    CHANGE_ORG_MEMBER_ROLE = "organizations.change_org_member_role", _("Can change organization member role")
