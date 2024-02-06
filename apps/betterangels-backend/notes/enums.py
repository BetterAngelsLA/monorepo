from enum import StrEnum


# If adding or removing Moods, don't forget to update the Moods table accordingly.
class MoodEnum(StrEnum):
    AGITATED = "Agitated"
    AGREEABLE = "Agreeable"
    ANXIOUS = "Anxious"
    DEPRESSED = "Depressed"
    DETACHED = "Detached"
    DISORGANIZED_THOUGHT = "Disorganized Thought"
    DISORIENTED = "Disoriented"
    ESCALATED = "Escalated"
    EUTHYMIC = "Euthymic"
    FLAT_BLUNTED = "Flat/blunted"
    HAPPY = "Happy"
    HOPELESS = "Hopeless"
    INDIFFERENT = "Indifferent"
    MANIC = "Manic"
    MOTIVATED = "Motivated"
    OPTIMISTIC = "Optimistic"
    PERSONABLE = "Personable"
    PLEASANT = "Pleasant"
    RESTLESS = "Restless"
    SUICIDAL = "Suicidal"


class CategoryEnum(StrEnum):
    Positive = "Positive"
    NEUTRAL = "Neutral"
    NEGATIVE = "Negative"


class ServiceEnum(StrEnum):
    BLANKET = "Blanket"
    BOOK = "Book"
    CLOTHES = "Clothes"
    DENTAL = "Dental"
    FOOD = "Food"
    HARM_REDUCTION = "Harm Reduction"
    HYGIENE_KIT = "Hygiene Kit"
    MEDICAL = "Medical"
    PET_CARE = "Pet Care"
    PET_FOOD = "Pet Food"
    SHELTER = "Shelter"
    SHOES = "Shoes"
    SHOWER = "Shower"
    STABILIZE = "Stabilize"
    STORAGE = "Storage"
    TRANSPORT = "Transport"
    WATER = "Water"
    OTHER = "Other"


class TaskStatusEnum(StrEnum):
    CANCELED = "Canceled"
    COMPLETED = "Completed"
    DRAFT_CANCELED = "Draft Canceled"
    DRAFT_COMPLETED = "Draft Completed"
    IN_PROGRESS = "In Progress"
