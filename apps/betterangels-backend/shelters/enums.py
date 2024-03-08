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


class ShelterTypeEnum(models.TextChoices):
    INTERIM_HOUSING = "Interim Housing", "Interim Housing"
    PERMANENT_HOUSING = "Permanent Housing", "Permanent Housing"
    A_BRIDGE_HOME = "A Bridge Home (ABH)", "A Bridge Home"
    PROJECT_HOMEKEY = "Project Homekey (PHK)", "Project Homekey (PHK)"
    TINY_HOME_VILLAGE = "Tiny Home Village", "Tiny Home Village"
    WINTER_SHELTER = "Winter Shelter", "Winter Shelter"
    EMERGENCY_SHELTER = "Emergency Shelter", "Emergency Shelter"
    CRISIS_HOUSING = "Crisis Housing", "Crisis Housing"
    RECUPERATIVE_CARE = "Recuperative Care", "Recuperative Care"
    TRANSITIONAL_HOUSING = "Transitional Housing", "Transitional Housing"
    ROADMAP_HOME = "Roadmap Home", "Roadmap Home"
    RAPID_REHOUSING = "Rapid Re-housing", "Rapid Re-housing"
    SOBER_LIVING = "Sober Living", "Sober Living"
