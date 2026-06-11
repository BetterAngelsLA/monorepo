from enum import Enum

import strawberry
from common.org_types import REGISTRY
from django.db import models
from django.utils.translation import gettext_lazy as _


class OrgRoleEnum(models.TextChoices):
    MEMBER = "member", _("Member")
    ADMIN = "admin", _("Admin")
    SUPERUSER = "superuser", _("Superuser")


# Dynamically built from the registry — adding a template to
# common.org_types.REGISTRY automatically exposes it here.
PermissionTemplateEnum = strawberry.enum(  # type: ignore[call-overload]
    Enum(
        "PermissionTemplateEnum",  # type: ignore[arg-type]
        {name.upper().replace(" ", "_"): name for name in REGISTRY.invitable_template_names()},
    )
)
