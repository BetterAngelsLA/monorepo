from django.db import models
from django.utils.translation import gettext_lazy as _


class OrganizationPermissions(models.TextChoices):
    VIEW = "organizations.view_organization", _("Can view organization")
    CHANGE = "organizations.change_organization", _("Can change organization")
    DELETE = "organizations.delete_organization", _("Can delete organization")
    ADD = "organizations.add_organization", _("Can add organization")
