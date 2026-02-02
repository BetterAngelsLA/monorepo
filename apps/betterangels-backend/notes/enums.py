import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class MoodEnum(models.TextChoices):
    AGITATED = "agitated", _("Agitated")
    AGREEABLE = "agreeable", _("Agreeable")
    ANXIOUS = "anxious", _("Anxious")
    DEPRESSED = "depressed", _("Depressed")
    DETACHED = "detached", _("Detached")
    DISORGANIZED_THOUGHT = "disorganized_thought", _("Disorganized Thought")
    DISORIENTED = "disoriented", _("Disoriented")
    ESCALATED = "escalated", _("Escalated")
    EUTHYMIC = "euthymic", _("Euthymic")
    FLAT_BLUNTED = "flat_blunted", _("Flat/blunted")
    HAPPY = "happy", _("Happy")
    HOPELESS = "hopeless", _("Hopeless")
    INDIFFERENT = "indifferent", _("Indifferent")
    MANIC = "manic", _("Manic")
    MOTIVATED = "motivated", _("Motivated")
    OPTIMISTIC = "optimistic", _("Optimistic")
    PERSONABLE = "personable", _("Personable")
    PLEASANT = "pleasant", _("Pleasant")
    RESTLESS = "restless", _("Restless")
    SUICIDAL = "suicidal", _("Suicidal")


class ServiceRequestStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


@strawberry.enum
class ServiceRequestTypeEnum(models.TextChoices):
    PROVIDED = "provided", "Provided"
    REQUESTED = "requested", "Requested"
