from django.db import models
from django.utils.translation import gettext_lazy as _


class MoodEnum(models.TextChoices):
    AGITATED = "AGITATED", _("Agitated")
    AGREEABLE = "AGREEABLE", _("Agreeable")
    ANXIOUS = "ANXIOUS", _("Anxious")
    DEPRESSED = "DEPRESSED", _("Depressed")
    DETACHED = "DETACHED", _("Detached")
    DISORGANIZED_THOUGHT = "DISORGANIZED_THOUGHT", _("Disorganized Thought")
    DISORIENTED = "DISORIENTED", _("Disoriented")
    ESCALATED = "ESCALATED", _("Escalated")
    EUTHYMIC = "EUTHYMIC", _("Euthymic")
    FLAT_BLUNTED = "FLAT_BLUNTED", _("Flat/blunted")
    HAPPY = "HAPPY", _("Happy")
    HOPELESS = "HOPELESS", _("Hopeless")
    INDIFFERENT = "INDIFFERENT", _("Indifferent")
    MANIC = "MANIC", _("Manic")
    MOTIVATED = "MOTIVATED", _("Motivated")
    OPTIMISTIC = "OPTIMISTIC", _("Optimistic")
    PERSONABLE = "PERSONABLE", _("Personable")
    PLEASANT = "PLEASANT", _("Pleasant")
    RESTLESS = "RESTLESS", _("Restless")
    SUICIDAL = "SUICIDAL", _("Suicidal")


class ServiceEnum(models.TextChoices):
    BLANKET = "BLANKET", _("Blanket")
    BOOK = "BOOK", _("Book")
    CLOTHES = "CLOTHES", _("Clothes")
    DENTAL = "DENTAL", _("Dental")
    FOOD = "FOOD", _("Food")
    HARM_REDUCTION = "HARM_REDUCTION", _("Harm Reduction")
    HYGIENE_KIT = "HYGIENE_KIT", _("Hygiene Kit")
    MEDICAL = "MEDICAL", _("Medical")
    PET_CARE = "PET_CARE", _("Pet Care")
    PET_FOOD = "PET_FOOD", _("Pet Food")
    SHELTER = "SHELTER", _("Shelter")
    SHOES = "SHOES", _("Shoes")
    SHOWER = "SHOWER", _("Shower")
    STABILIZE = "STABILIZE", _("Stabilize")
    STORAGE = "STORAGE", _("Storage")
    TRANSPORT = "TRANSPORT", _("Transport")
    WATER = "WATER", _("Water")
    OTHER = "OTHER", _("Other")


class TaskStatusEnum(models.TextChoices):
    COMPLETED = "COMPLETED", _("Completed")
    TO_DO = "TO_DO", _("To Do")


class ServiceRequestStatusEnum(models.TextChoices):
    COMPLETED = "COMPLETED", _("Completed")
    TO_DO = "TO_DO", _("To Do")
