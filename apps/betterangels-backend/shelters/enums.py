from django.db import models
from django.utils.translation import gettext_lazy as _


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


class RequirementEnum(models.TextChoices):
    PHOTO_ID = "Photo ID", _("Photo ID")
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare", _("Medicaid or Medicare")
    VETERAN = "Veteran", _("Veteran")
    RESERVATION = "Reservation", _("Reservation")
    REFERRAL = "Referral", _("Referral")
    WHEELCHAIR_ACCESSIBLE = "Wheelchair Accessibel", _("Wheelchair Accessible")
    MEDICAL_EQUIPMENT_PERMITTED = "Medical Equipment Permitted", _("Medical Equipment Permitted")
    PETS_ALLOWED = "Pets Allowed", _("Pets Allowed")


class HowToEnterEnum(models.TextChoices):
    CALL = "Call", _("Call")
    REFERRAL = "Referral", _("Referral")
    WALK_IN = "Walk-In", _("Walk-In")


class BedStateEnum(models.TextChoices):
    RESERVED = "Reserved", _("Reserved")
    OCCUPIED = "Occupied", _("Occupied")
    EMPTY = "Empty", _("Empty")


class ShelterTypeEnum(models.TextChoices):
    INTERIM_HOUSING = "Interim Housing", _("Interim Housing")
    PERMANENT_HOUSING = "Permanent Housing", _("Permanent Housing")
    A_BRIDGE_HOME = "A Bridge Home (ABH)", _("A Bridge Home")
    PROJECT_HOMEKEY = "Project Homekey (PHK)", _("Project Homekey (PHK)")
    TINY_HOME_VILLAGE = "Tiny Home Village", _("Tiny Home Village")
    WINTER_SHELTER = "Winter Shelter", _("Winter Shelter")
    EMERGENCY_SHELTER = "Emergency Shelter", _("Emergency Shelter")
    CRISIS_HOUSING = "Crisis Housing", _("Crisis Housing")
    RECUPERATIVE_CARE = "Recuperative Care", _("Recuperative Care")
    TRANSITIONAL_HOUSING = "Transitional Housing", _("Transitional Housing")
    ROADMAP_HOME = "Roadmap Home", _("Roadmap Home")
    RAPID_REHOUSING = "Rapid Re-housing", _("Rapid Re-housing")
    SOBER_LIVING = "Sober Living", _("Sober Living")


class FunderEnum(models.TextChoices):
    MPP = "MPP", _("MPP")
    LAHSA = "LAHSA", _("LAHSA")
    DMH = "DMH", _("DMH")
    DHS = "DHS", _("DHS")
