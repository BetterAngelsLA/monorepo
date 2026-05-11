import datetime

import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


# Summary Info
@strawberry.enum
class DemographicChoices(models.TextChoices):
    ALL = "all", _("All")
    COUPLES = "couples", _("Couples")
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
    ACCESS_CENTER = "access_center", _("Access Center / Day Center")
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
    UNIT_STORAGE = "unit_storage", _("Unit-level Storage")
    AMNESTY_LOCKERS = "amnesty_lockers", _("Amnesty Lockers")
    STANDARD_LOCKERS = "standard_lockers", _("Standard Lockers")
    SHARED_STORAGE = "shared_storage", _("Shared Storage")
    PERSONAL_BIN = "personal_bin", _("Personal Storage Bin")
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
    STREET = "street", _("Street Parking")
    NO_PARKING = "no_parking", _("No Parking")


# Entry Requirements
@strawberry.enum
class EntryRequirementChoices(models.TextChoices):
    BACKGROUND = "background", _("Background Check")
    HOMELESS_VERIFICATION = "homeless_verification", _("Homeless Verification/Observation")
    MEDICAID_OR_MEDICARE = "medicaid_or_medicare", _("Medicaid or Medicare")
    PHOTO_ID = "photo_id", _("Photo ID")
    REFERRAL = "referral", _("Referral")
    RESERVATION = "reservation", _("Reservation")
    VEHICLE_REGISTRATION = "vehicle_registration", _("Vehicle Registration/Insurance")
    WALK_UPS = "walk_ups", _("Walk-Ups")
    IN_SPA_ONLY = "in_spa_only", _("In-SPA Only")


@strawberry.enum
class VaccinationRequirementChoices(models.TextChoices):
    TB = "tb", _("TB")
    FLU = "flu", _("Flu")
    COVID_19 = "covid_19", _("COVID-19")


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
class ReferralRequirementChoices(models.TextChoices):
    REFERRAL_MATCHED = "referral_matched", _("Matched Referral")
    REFERRAL_NONMATCHED = "referral_nonmatched", _("Non-Matched Referral")
    SERVICE_PROVIDER_SUBMISSION = "service_provider_submission", _("Service Provider Submission")
    SELF_REFERRAL = "self_referral", _("Self Referral Option")
    SAME_DAY_INTAKE = "same_day_intake", _("Same Day Intake")


@strawberry.enum
class BedStatusChoices(models.TextChoices):
    AVAILABLE = "available", _("Available")
    OCCUPIED = "occupied", _("Occupied")
    RESERVED = "reserved", _("Reserved")
    OUT_OF_SERVICE = "out_of_service", _("Out-of-Service")


@strawberry.enum
class RoomStatusChoices(models.TextChoices):
    AVAILABLE = "available", _("Available")
    RESERVED = "reserved", _("Reserved")
    NEEDS_MAINTENANCE = "needs_maintenance", _("Needs Maintenance")


@strawberry.enum
class BedTypeChoices(models.TextChoices):
    TWIN = "twin", _("Twin")
    BUNK = "bunk", _("Bunk")
    ROLLAWAY = "rollaway", _("Rollaway")
    OTHER = "other", _("Other")


@strawberry.enum
class MedicalNeedChoices(models.TextChoices):
    ERC = "erc", _("ERC (Enrich Residential Care)")
    DMH = "dmh", _("DMH Beds (Dept of Mental Health)")
    OXYGEN = "oxygen", _("Oxygen")
    DIALYSIS = "dialysis", _("Dialysis")


@strawberry.enum
class ReservationStatusChoices(models.TextChoices):
    OPEN = "open", _("Open")
    CONFIRMED = "confirmed", _("Confirmed")
    CHECKED_IN = "checked_in", _("Checked In")
    COMPLETED = "completed", _("Completed")
    CANCELLED = "cancelled", _("Cancelled")
    CHECK_IN_OVERDUE = "check_in_overdue", _("Check-in Overdue")


@strawberry.enum
class DayOfWeekChoices(models.TextChoices):
    MONDAY = "monday", _("Monday")
    TUESDAY = "tuesday", _("Tuesday")
    WEDNESDAY = "wednesday", _("Wednesday")
    THURSDAY = "thursday", _("Thursday")
    FRIDAY = "friday", _("Friday")
    SATURDAY = "saturday", _("Saturday")
    SUNDAY = "sunday", _("Sunday")

    @classmethod
    def from_date(cls, d: "datetime.date") -> "DayOfWeekChoices":
        """Return the enum member for the weekday of *d*."""
        return list(cls)[d.weekday()]


@strawberry.enum
class ScheduleTypeChoices(models.TextChoices):
    OPERATING = "operating", _("Operating Hours")
    INTAKE = "intake", _("Intake Hours")
    MEAL_SERVICE = "meal_service", _("Meal Service Hours")
    STAFF_AVAILABILITY = "staff_availability", _("Staff Availability")


@strawberry.enum
class ConditionChoices(models.TextChoices):
    HEAT = "heat", _("Heat")
    FIRE = "fire", _("Fire")
    RAIN_SEVERE_WEATHER = "rain_severe_weather", _("Rain / Severe Weather")
    WIND = "wind", _("Wind")
    AIR_QUALITY_SMOKE = "air_quality_smoke", _("Air Quality / Smoke")
    PUBLIC_HEALTH_EMERGENCY = "public_health_emergency", _("Public Health Emergency")
    EMERGENCY_EVACUATION = "emergency_evacuation", _("Emergency Evacuation")


@strawberry.enum
class MediaLinkTypeChoices(models.TextChoices):
    YOUTUBE = "youtube", _("YouTube")


@strawberry.enum
class ShelterPhotoTypeChoices(models.TextChoices):
    INTERIOR = "interior", _("Interior")
    EXTERIOR = "exterior", _("Exterior")
