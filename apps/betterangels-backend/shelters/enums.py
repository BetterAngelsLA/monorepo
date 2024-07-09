from django.db import models
from django.utils.translation import gettext_lazy as _


class ImmediateNeedsEnum(models.TextChoices):
    FOOD = "Food", _("Food")
    SHOWERS = "Showers", _("Showers")
    CLOTHING = "Clothing", _("Clothing")


class ServiceEnum(models.TextChoices):
    FOOD = "Food", _("Food")
    SHOWERS = "Showers", _("Showers")
    CLOTHING = "Clothing", _("Clothing")
    MAIL = "Mail", _("Mail")
    PHONE = "Phone", _("Phone")
    COMPUTERS = "Computers", _("Computers")
    JOB_TRAINING = "Job Training", _("Job Training")
    TUTORING = "Tutoring", _("Tutoring")
    LIFE_SKILLS_TRAINING = "Life Skills Training", _("Life Skills Training")
    MEDICAL_SERVICES = "Medical Services", _("Medical Services")
    MENTAL_HEALTH = "Mental Health", _("Mental Health")
    DRUG_TREATMENT = "Drug Treatment", _("Drug Treatment")
    FINANCIAL_PLANNING = "Financial Planning", _("Financial Planning")
    LEGAL_ASSISTANCE = "Legal Assistance", _("Legal Assistance")
    TRANSPORTATION = "Transportation", _("Transportation")


class PetsAllowedEnum(models.TextChoices):
    SERVICE_ANIMAL = "Service Animal", _("Service Animal")
    CATS = "Cats", _("Cats")
    EMOTIONAL_SUPPORT = "Emotional Support", _("Emotional Support")
    DOGS_UNDER_25_LBS = "Dogs <25lbs", _("Dogs <25lbs")
    DOGS_OVER_25_LBS = "Dogs >25lbs", _("Dogs >25lbs")
    EXOTICS = "Exotics", _("Exotics")


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


class EntryRequirements(models.TextChoices):
    PHOTO_ID = "Photo ID", _("Photo ID")
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", _("Medicaid or Medicare")
    RESERVATION = "Reservation", _("Reservation")
    REFERRAL = "Referral", _("Referral")


class BedStateEnum(models.TextChoices):
    RESERVED = "Reserved", _("Reserved")
    OCCUPIED = "Occupied", _("Occupied")
    EMPTY = "Empty", _("Empty")


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


class FunderEnum(models.TextChoices):
    MPP = "MPP", _("MPP")
    LAHSA = "LAHSA", _("LAHSA")
    DMH = "DMH", _("DMH")
    DHS = "DHS", _("DHS")
