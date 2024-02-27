from django.db import models


# If adding or removing Services, don't forget to update the Services table accordingly.
class ServiceEnum(models.TextChoices):
    FOOD = "Food", "Food"
    SHOWERS = "Shower", "Shower"
    CLOTHING = "Clothing", "Clothing"
    MAIL = "Mail", "Mail"
    PHONE = "Phone", "Phone"
    COMPUTERS = "Computers", "Computes"
    JOB_TRAINING = "Job Training", "Job Training"
    TUTORING = "Tutoring", "Tutoring"
    LIFE_SKILLS_TRAINING = "Life Skills Training", "Life Skills Training"
    MEDICAL_SERVICES = "Medical Services", "Medical Services"
    MENTAL_HEALTH = "Mental Health", "Mental Health"
    DRUG_TREATMENT = "Drug Treatment", "Drug Treatment"
    FINANCIAL_PLANNING = "Financial Planning", "Financial Planning"
    LEGAL_ASSISTANCE = "Legal Assistance", "Legal Assistance"
    TRANSPORTATION = "Transportation", "Transportation"


class PopulationEnum(models.TextChoices):
    ADULTS = "Adults", "Adults"
    MEN = "Men", "Men"
    WOMEN = "Women", "Women"
    FAMILIES = "Families", "Families"
    YOUTH = "Youth", "Youth"
    BOYS = "Boys", "Boys"
    GIRLS = "Girls", "Girls"
    SENIORS = "Seniors", "Seniors"
    VETERANS = "Veterans", "Veterans"
    LGBTQ = "LGBTQ", "LGBTQ"


class RequirementEnum(models.TextChoices):
    PHOTO_ID = "Photo ID", "Photo ID"
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", "Medicaid or Medicare"
    VETERAN = "Veteran", "Veteran"

    # TODO - does this belong in how to enter?
    RESERVATION = "Reservation", "Reservation"
    REFERRAL = "Referral", "Referral"


class HowToEnterEnum(models.TextChoices):
    CALL = "Call", "Call"
    REFERRAL = "Referral", "Referral"
    WALK_IN = "Walk-In", "Walk-In"


class BedStateEnum(models.TextChoices):
    RESERVED = "Reserved", "Reserved"
    OCCUPIED = "Occupied", "Occupied"
    EMPTY = "Empty", "Empty"
