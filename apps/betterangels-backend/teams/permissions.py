import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


@strawberry.enum
class TeamPermissions(models.TextChoices):
    MANAGE = "teams.manage_teams", _("Can manage teams")
