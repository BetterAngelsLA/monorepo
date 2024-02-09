from django.db import models


class MoodEnum(models.TextChoices):
    AGITATED = "agitated", "Agitated"
    AGREEABLE = "agreeable", "Agreeable"
    ANXIOUS = "anxious", "Anxious"
    DEPRESSED = "depressed", "Depressed"
    DETACHED = "detached", "Detached"
    DISORGANIZED_THOUGHT = "disorganized_thought", "Disorganized Thought"
    DISORIENTED = "disoriented", "Disoriented"
    ESCALATED = "escalated", "Escalated"
    EUTHYMIC = "euthymic", "Euthymic"
    FLAT_BLUNTED = "flat_blunted", "Flat/blunted"
    HAPPY = "happy", "Happy"
    HOPELESS = "hopeless", "Hopeless"
    INDIFFERENT = "indifferent", "Indifferent"
    MANIC = "manic", "Manic"
    MOTIVATED = "motivated", "Motivated"
    OPTIMISTIC = "optimistic", "Optimistic"
    PERSONABLE = "personable", "Personable"
    PLEASANT = "pleasant", "Pleasant"
    RESTLESS = "restless", "Restless"
    SUICIDAL = "suicidal", "Suicidal"


class ServiceEnum(models.TextChoices):
    BLANKET = "blanket", "Blanket"
    BOOK = "book", "Book"
    CLOTHES = "clothes", "Clothes"
    DENTAL = "dental", "Dental"
    FOOD = "food", "Food"
    HARM_REDUCTION = "harm_reduction", "Harm Reduction"
    HYGIENE_KIT = "hygiene_kit", "Hygiene Kit"
    MEDICAL = "medical", "Medical"
    PET_CARE = "pet_care", "Pet Care"
    PET_FOOD = "pet_food", "Pet Food"
    SHELTER = "shelter", "Shelter"
    SHOES = "shoes", "Shoes"
    SHOWER = "shower", "Shower"
    STABILIZE = "stabilize", "Stabilize"
    STORAGE = "storage", "Storage"
    TRANSPORT = "transport", "Transport"
    WATER = "water", "Water"
    OTHER = "other", "Other"


class ServiceTypeEnum(models.TextChoices):
    PROVIDED = "provided", "Provided"
    REQUESTED = "requested", "Requested"
