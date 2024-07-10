from django.db import models
from django.utils.translation import gettext_lazy as _


# Advanced Info
class ShelterTypeEnum(models.TextChoices):
    FAITH_BASED = "Faith Based", _("Faith Based")
    INTERIM_HOUSING = "Interim Housing", _("Interim Housing")
    PERMANENT_HOUSING = "Permanent Housing", _("Permanent Housing")
    A_BRIDGE_HOME = "A Bridge Home", _("A Bridge Home")
    PROJECT_HOMEKEY = "Project Home Key (PHK)", _("Project Home Key (PHK)")
    TINY_HOME_VILLAGE = "Tiny Home Village", _("Tiny Home Village")
    WINTER_SHELTER = "Winter Shelter", _("Winter Shelter")
    EMERGENCY_SHELTER = "Emergency Shelter", _("Emergency Shelter")
    CRISIS_HOUSING = "Crisis Housing", _("Crisis Housing")
    RECUPERATIVE_CARE = "Recuperative Care", _("Recuperative Care")
    TRANSITIONAL_HOUSING = "Transitional Housing", _("Transitional Housing")
    ROADMAP_HOME = "Roadmap Home", _("Roadmap Home")
    RAPID_REHOUSING = "Rapid Rehousing", _("Rapid Rehousing")
    SOBER_LIVING = "Sober Living", _("Sober Living")
    SAFE_PARK_LA = "Safe Park LA", _("Safe Park LA")


class PopulationEnum(models.TextChoices):
    ADULTS = "Adults", _("Adults")
    MEN = "Men", _("Men")
    WOMEN = "Women", _("Women")
    FAMILIES = "Families", _("Families")
    YOUTH = "Youth (TAY)", _("Youth (TAY)")
    BOYS = "Boys", _("Boys")
    GIRLS = "Girls", _("Girls")
    SENIORS = "Seniors (55+)", _("Seniors (55+)")
    VETERANS = "Veterans", _("Veterans")
    LGBTQ = "LGBTQ", _("LGBTQ")
    HIV_AND_AIDS = "HIV/AIDS", _("HIV/AIDS")


class ImmediateNeedEnum(models.TextChoices):
    FOOD = "Food", _("Food")
    SHOWERS = "Showers", _("Showers")
    CLOTHING = "Clothing", _("Clothing")


class GeneralServiceEnum(models.TextChoices):
    MAIL = "Mail", _("Mail")
    PHONE = "Phone", _("Phone")
    COMPUTERS = "Computers", _("Computers")
    LEGAL_ASSISTANCE = "Legal Assistance", _("Legal Assistance")
    TRANSPORTATION = "Transportation", _("Transportation")
    CASE_MANAGEMENT = "Case Management", _("Case Management")
    MONEY_MANAGEMENT = "Money Management", _("Money Management")


class HealthServiceEnum(models.TextChoices):
    MEDICATION_MONITORING = "Medication Monitoring", _("Medication Monitoring")
    MEDICATION_ADMINISTRATION = "Medication Administration", _("Medication Administration")
    MENTAL_HEALTH = "Mental Health", _("Mental Health")
    DRUG_TREATMENT = "Drug Treatment", _("Drug Treatment")


class CareerServiceEnum(models.TextChoices):
    JOB_TRAINING = "Job Training", _("Job Training")
    TUTORING = "Tutoring", _("Tutoring")
    LIFE_SKILLS_TRAINING = "Life Skills Training", _("Life Skills Training")


class FunderEnum(models.TextChoices):
    LAHSA = "LAHSA", _("LAHSA")
    DMH = "DMH", _("DMH")
    DHS = "DHS", _("DHS")
    PRIVATE = "Private", _("Private")
    FEDERAL_FUNDING = "Federal Funding", _("Federal Funding")
    HOPWA = "HOPWA", _("HOPWA")


class AccessibilityEnum(models.TextChoices):
    WHEELCHAIR_ACCESSIBLE = "Wheelchair Accessible", _("Wheelchair Accessible")
    MEDICAL_EQUIPMENT_PERMITTED = "Medical Equipment Permitted", _("Medical Equipment Permitted")


class StorageEnum(models.TextChoices):
    STORAGE = "Storage", _("Storage")
    LOCKERS = "Lockers", _("Lockers")
    AMNESTY_LOCKERS = "Amnesty Lockers", _("Amnesty Lockers")


class ParkingEnum(models.TextChoices):
    AUTO_OR_SMALL_TRUCK = "Auto or Small Truck", _("Auto or Small Truck")
    BICYCLE = "Bicycle", _("Bicycle")
    MOTOR_CYCLE = "Motor Cycle", _("Motor Cycle")
    RV = "RV", _("RV")


# Restrictions
class EntryRequirementEnum(models.TextChoices):
    PHOTO_ID = "Photo ID", _("Photo ID")
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", _("Medicaid or Medicare")
    RESERVATION = "Reservation", _("Reservation")
    REFERRAL = "Referral", _("Referral")


## Check if needed? ###


class PetsAllowedEnum(models.TextChoices):
    SERVICE_ANIMAL = "Service Animal", _("Service Animal")
    CATS = "Cats", _("Cats")
    EMOTIONAL_SUPPORT = "Emotional Support", _("Emotional Support")
    DOGS_UNDER_25_LBS = "Dogs <25lbs", _("Dogs <25lbs")
    DOGS_OVER_25_LBS = "Dogs >25lbs", _("Dogs >25lbs")
    EXOTICS = "Exotics", _("Exotics")


class BedStateEnum(models.TextChoices):
    RESERVED = "Reserved", _("Reserved")
    OCCUPIED = "Occupied", _("Occupied")
    EMPTY = "Empty", _("Empty")
