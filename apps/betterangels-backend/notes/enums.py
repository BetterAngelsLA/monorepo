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


@strawberry.enum
class NoteNamespaceEnum(models.TextChoices):
    MOOD_ASSESSMENT = "mood_assessment", "Mood Assessment"
    PROVIDED_SERVICES = "provided_services", "Provided Services"
    REQUESTED_SERVICES = "requested_services", "Requested Services"


class ServiceEnum(models.TextChoices):
    BLANKET = "blanket", _("Blanket")
    BOOK = "book", _("Book")
    CLOTHES = "clothes", _("Clothes")
    DENTAL = "dental", _("Dental")
    FOOD = "food", _("Food")
    HARM_REDUCTION = "harm_reduction", _("Harm Reduction")
    HYGIENE_KIT = "hygiene_kit", _("Hygiene Kit")
    MEDICAL = "medical", _("Medical")
    PET_CARE = "pet_care", _("Pet Care")
    PET_FOOD = "pet_food", _("Pet Food")
    SHELTER = "shelter", _("Shelter")
    SHOES = "shoes", _("Shoes")
    SHOWER = "shower", _("Shower")
    STABILIZE = "stabilize", _("Stabilize")
    STORAGE = "storage", _("Storage")
    TRANSPORT = "transport", _("Transport")
    WATER = "water", _("Water")
    OTHER = "other", _("Other")


class TaskStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


class ServiceRequestStatusEnum(models.TextChoices):
    COMPLETED = "completed", _("Completed")
    TO_DO = "to_do", _("To Do")


@strawberry.enum
class TaskTypeEnum(models.TextChoices):
    PURPOSE = "purpose", "Purpose"
    NEXT_STEP = "next_step", "Next Step"


@strawberry.enum
class ServiceRequestTypeEnum(models.TextChoices):
    PROVIDED = "provided", "Provided"
    REQUESTED = "requested", "Requested"
