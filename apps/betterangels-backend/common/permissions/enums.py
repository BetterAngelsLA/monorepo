from django.db import models
from django.utils.translation import gettext_lazy as _


class AttachmentPermissions(models.TextChoices):
    VIEW = "common.view_attachment", _("Can view attachment")
    CHANGE = "common.change_attachment", _("Can change attachment")
    DELETE = "common.delete_attachment", _("Can delete attachment")
    ADD = "common.add_attachment", _("Can add attachment")


class AddressPermissions(models.TextChoices):
    ADD = "common.add_address", _("Can add address")
    CHANGE = "common.change_address", _("Can change address")
    DELETE = "common.delete_address", _("Can delete address")
    VIEW = "common.view_address", _("Can view address")
