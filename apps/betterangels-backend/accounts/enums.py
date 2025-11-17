import enum

from django.db import models
from django.utils.translation import gettext_lazy as _


class OrgRoleEnum(models.TextChoices):
    MEMBER = "member", _("Member")
    ADMIN = "admin", _("Admin")
    SUPERUSER = "superuser", _("Superuser")


class OrganizationMemberOrderField(str, enum.Enum):
    FIRST_NAME = "FIRST_NAME"
    LAST_NAME = "LAST_NAME"
    EMAIL = "EMAIL"
    LAST_LOGIN = "LAST_LOGIN"
    ROLE = "ROLE"


class Ordering(str, enum.Enum):
    ASC = "ASC"
    ASC_NULLS_FIRST = "ASC_NULLS_FIRST"
    ASC_NULLS_LAST = "ASC_NULLS_LAST"
    DESC = "DESC"
    DESC_NULLS_FIRST = "DESC_NULLS_FIRST"
    DESC_NULLS_LAST = "DESC_NULLS_LAST"
