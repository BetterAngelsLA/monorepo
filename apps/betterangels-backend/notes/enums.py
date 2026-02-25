import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class ServiceRequestStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


@strawberry.enum
class ServiceRequestTypeEnum(models.TextChoices):
    PROVIDED = "provided", "Provided"
    REQUESTED = "requested", "Requested"
