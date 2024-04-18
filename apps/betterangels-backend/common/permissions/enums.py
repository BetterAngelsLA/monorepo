from django.db import models
from django.utils.translation import gettext_lazy as _


class AttachmentPermissions(models.TextChoices):
    VIEW = "common.view_attachment", _("Can view attachment")
    CHANGE = "common.change_attachment", _("Can change attachment")
    DELETE = "common.delete_attachment", _("Can delete attachment")
    ADD = "common.add_attachment", _("Can add attachment")


class AddressPermissions(models.TextChoices):
    VIEW = "common.view_address", _("Can view address")
    ADD = "common.add_address", _("Can add address")


class LocationPermissions(models.TextChoices):
    VIEW = "common.view_location", _("Can view location")
    CHANGE = "common.change_location", _("Can change location")
    DELETE = "common.delete_location", _("Can delete location")
    ADD = "common.add_location", _("Can add location")
