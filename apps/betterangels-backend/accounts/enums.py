from django.db import models
from django.utils.translation import gettext_lazy as _


class OrgRoleEnum(models.TextChoices):
    MEMBER = "member", _("Member")
    ADMIN = "admin", _("Admin")
    SUPERUSER = "superuser", _("Superuser")
