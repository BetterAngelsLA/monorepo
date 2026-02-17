import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


# Summary Info
@strawberry.enum
class DemographicChoices(models.TextChoices):
    ALL = "all", _("All")
    SINGLE_MEN = "single_men", _("Single Men")
    SINGLE_WOMEN = "single_women", _("Single Women")
    TAY_TEEN = "tay_teen", _("TAY/Teen")
    SENIORS = "seniors", _("Seniors")
    FAMILIES = "families", _("Families")
    SINGLE_MOMS = "single_moms", _("Single Moms")
    SINGLE_DADS = "single_dads", _("Single Dads")
    LGBTQ_PLUS = "lgbtq_plus", _("LGBTQ+")
    OTHER = "other", _("Other")


@strawberry.enum
class SpecialSituationRestrictionChoices(models.TextChoices):
    NONE = "none", _("None")
    DOMESTIC_VIOLENCE = "domestic_violence", _("Domestic Violence (DV/IPV)")
    HIV_AIDS = "hiv_aids", _("HIV/AIDS")
    HUMAN_TRAFFICKING = "human_trafficking", _("Human Trafficking")
    JUSTICE_SYSTEMS = "justice_systems", _("Persons Exiting Justice Systems")
    VETERANS = "veterans", _("Veterans")
    HARM_REDUCTION = "harm_reduction", _("Harm Reduction")


@strawberry.enum
class ShelterChoices(models.TextChoices):
    BUILDING = "building", _("Building")
    CHURCH = "church", _("Church")
    HOTEL_MOTEL = "hotel_motel", _("Hotel/Motel")
    SAFE_PARKING = "safe_parking", _("Safe Parking")
    SINGLE_FAMILY_HOUSE = "single_family_house", _("Single Family House")
    TINY_HOMES = "tiny_homes", _("Tiny Homes")
    OTHER = "other", _("Other")


# Sleeping Details
@strawberry.enum
class RoomStyleChoices(models.TextChoices):
    CONGREGATE = "congregate", _("Congregate (Open)")
    CUBICLE_LOW_WALLS = "cubicle_low_walls", _("Cubicle (Low Walls)")
    CUBICLE_HIGH_WALLS = "cubicle_high_walls", _("Cubicle (High Walls)")
    HIGH_BUNK = "high_bunk", _("High Bunk")
    LOW_BUNK = "low_bunk", _("Low Bunk")
    SHARED_ROOMS = "shared_rooms", _("Shared Rooms")
    SINGLE_ROOM = "single_room", _("Single Room")
    MOTEL_ROOM = "motel_room", _("Motel Room")
    OTHER = "other", _("Other")


# Shelter Details
@strawberry.enum
class AccessibilityChoices(models.TextChoices):
    MEDICAL_EQUIPMENT_PERMITTED = "medical_equipment_permitted", _("Medical Equipment Permitted")
    WHEELCHAIR_ACCESSIBLE = "wheelchair_accessible", _("Wheelchair Accessible")
    ADA_ROOMS = "ada_rooms", _("ADA Rooms Available")


@strawberry.enum
class StorageChoices(models.TextChoices):
    AMNESTY_LOCKERS = "amnesty_lockers", _("Amnesty Lockers")
    STANDARD_LOCKERS = "standard_lockers", _("Standard Lockers")
    SHARED_STORAGE = "shared_storage", _("Shared Storage")
    NO_STORAGE = "no_storage", _("No Storage")


@strawberry.enum
class PetChoices(models.TextChoices):
    CATS = "cats", _("Cats")
    DOGS_UNDER_25_LBS = "dogs_under_25_lbs", _("Dogs (< 25 lbs)")
    DOGS_OVER_25_LBS = "dogs_over_25_lbs", _("Dogs (> 25 lbs)")
    EXOTICS = "exotics", _("Exotics")
    SERVICE_ANIMALS = "service_animals", _("Service Animals")
    PET_AREA = "pet_area", _("Pet Area")
    NO_PETS_ALLOWED = "no_pets_allowed", _("No Pets Allowed")


@strawberry.enum
class ParkingChoices(models.TextChoices):
    BICYCLE = "bicycle", _("Bicycle")
    MOTORCYCLE = "motorcycle", _("Motorcycle")
    AUTOMOBILE = "automobile", _("Automobile")
    RV = "rv", _("RV")
    NO_PARKING = "no_parking", _("No Parking")


# Services Offered
@strawberry.enum
class ImmediateNeedChoices(models.TextChoices):
    CLOTHING = "clothing", _("Clothing")
    FOOD = "food", _("Food")
    SHOWERS = "showers", _("Showers")


@strawberry.enum
class GeneralServiceChoices(models.TextChoices):
    CASE_MANAGEMENT = "case_management", _("Case Management")
    CHILDCARE = "childcare", _("Childcare")
    COMPUTER_ACCESS = "computer_access", _("Computer Access")
    EMPLOYMENT_SERVICES = "employment_services", _("Employment Services")
    FINANCIAL_LITERACY_ASSISTANCE = "financial_literacy_assistance", _("Financial Literacy/Assistance")
    HOUSING_NAVIGATION = "housing_navigation", _("Housing Navigation")
    LEGAL_ASSISTANCE = "legal_assistance", _("Legal Assistance")
    MAIL = "mail", _("Mail")
    PHONE = "phone", _("Phone")
    TRANSPORTATION = "transportation", _("Transportation")
    LAUNDRY = "laundry", _("Laundry Services")
    TLS = "tls", _("TLS (Time Limited Subsidies)")


@strawberry.enum
class HealthServiceChoices(models.TextChoices):
    DENTAL = "dental", _("Dental")
    MEDICAL = "medical", _("Medical")
    MENTAL_HEALTH = "mental_health", _("Mental Health")
    SUBSTANCE_USE_TREATMENT = "substance_use_treatment", _("Substance Use Treatment")


@strawberry.enum
class TrainingServiceChoices(models.TextChoices):
    JOB_TRAINING = "job_training", _("Job Training")
    LIFE_SKILLS_TRAINING = "life_skills_training", _("Life Skills Training")
    TUTORING = "tutoring", _("Tutoring")


# Entry Requirements
@strawberry.enum
class EntryRequirementChoices(models.TextChoices):
    MEDICAID_OR_MEDICARE = "medicaid_or_medicare", _("Medicaid or Medicare")
    PHOTO_ID = "photo_id", _("Photo ID")
    REFERRAL = "referral", _("Referral")
    RESERVATION = "reservation", _("Reservation")
    BACKGROUND = "background", _("Background Check")
    HOMELESS_VERIFICATION = "homeless_verification", _("Homeless Verification/Observation")
    WALK_UPS = "walk_ups", _("Walk-Ups")
    VEHICLE_REGISTRATION = "vehicle_registration", _("Vehicle Registration/Insurance")


# Ecosystem Information
CITY_COUNCIL_DISTRICT_CHOICES = [(0, "Unincorporated")] + [(i, str(i)) for i in range(1, 16)]
SUPERVISORIAL_DISTRICT_CHOICES = [(i, str(i)) for i in range(1, 6)]


@strawberry.enum
class SPAChoices(models.IntegerChoices):
    ONE = 1, _("1 - Antelope Valley")
    TWO = 2, _("2 - San Fernando")
    THREE = 3, _("3 - San Gabriel")
    FOUR = 4, _("4 - Metro")
    FIVE = 5, _("5 - West")
    SIX = 6, _("6 - South")
    SEVEN = 7, _("7 - East")
    EIGHT = 8, _("8 - South Bay/Harbor")


@strawberry.enum
class ShelterProgramChoices(models.TextChoices):
    BRIDGE_HOME = "bridge_home", _("Bridge Home")
    CRISIS_HOUSING = "crisis_housing", _("Crisis Housing")
    EMERGENCY_SHELTER = "emergency_shelter", _("Emergency Shelter")
    FAITH_BASED = "faith_based", _("Faith Based")
    INTERIM_HOUSING = "interim_housing", _("Interim Housing")
    PERMANENT_HOUSING = "permanent_housing", _("Permanent Housing")
    PROJECT_HOME_KEY = "project_home_key", _("Project Home Key (PHK)")
    RAPID_REHOUSING = "rapid_rehousing", _("Rapid Rehousing")
    RECUPERATIVE_CARE = "recuperative_care", _("Recuperative Care")
    ROADMAP_HOME = "roadmap_home", _("Roadmap Home")
    SAFE_PARK_LA = "safe_park_la", _("Safe Park LA")
    SOBER_LIVING = "sober_living", _("Sober Living")
    TINY_HOME_VILLAGE = "tiny_home_village", _("Tiny Home Village")
    TRANSITIONAL_HOUSING = "transitional_housing", _("Transitional Housing")
    WINTER_SHELTER = "winter_shelter", _("Winter Shelter")
    OTHER = "other", _("Other")


@strawberry.enum
class FunderChoices(models.TextChoices):
    CITY_OF_LOS_ANGELES = "city_of_los_angeles", _("City of Los Angeles")
    DHS = "dhs", _("DHS")
    DMH = "dmh", _("DMH")
    FEDERAL_FUNDING = "federal_funding", _("Federal Funding")
    HOPWA = "hopwa", _("HOPWA")
    LAHSA = "lahsa", _("LAHSA")
    PRIVATE = "private", _("Private")
    OTHER = "other", _("Other")


# Better Angels Admin
@strawberry.enum
class StatusChoices(models.TextChoices):
    DRAFT = "draft", _("Draft")
    PENDING = "pending", _("Pending")
    APPROVED = "approved", _("Approved")
    INACTIVE = "inactive", _("Inactive")


@strawberry.enum
class ExitPolicyChoices(models.TextChoices):
    MIA = "mia", _("Exit after 72 hours of being MIA")
    VIOLENCE = "violence", _("Exit due to violence to self or others")
    MITIGATION = "mitigation", _("30 Days Mitigation plan prior to exits")
    OTHER = "other", _("Other")


@strawberry.enum
class MealServiceChoices(models.TextChoices):
    BREAKFAST = "breakfast", _("Breakfast")
    LUNCH = "lunch", _("Lunch")
    DINNER = "dinner", _("Dinner")


@strawberry.enum
class ReferralRequirementChoices(models.TextChoices):
    REFERRAL_MATCHED = "referral_matched", _("Matched Referral")
    REFERRAL_NONMATCHED = "referral_nonmatched", _("Non-Matched Referral")
    SERVICE_PROVIDER_SUBMISSION = "service_provider_submission", _("Service Provider Submission")
    SELF_REFERRAL = "self_referral", _("Self Referral Option")
    SAME_DAY_INTAKE = "same_day_intake", _("Same Day Intake")


@strawberry.enum
class BedStatusChoices(models.TextChoices):
    AVAILABLE = "available", _("Available")
    RESERVED = "reserved", _("Reserved")
