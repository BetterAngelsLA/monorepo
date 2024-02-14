from enum import StrEnum


# If adding or removing Services, don't forget to update the Services table accordingly.
class ServiceEnum(StrEnum):
    FOOD = "Food"
    SHOWERS = "Shower"
    CLOTHING = "Clothing"
    MAIL = "Mail"
    PHONE = "Phone"
    COMPUTERS = "Computers"
    JOB_TRAINING = "Job Training"
    TUTORING = "Tutoring"
    LIFE_SKILLS_TRAINING = "Life Skills Training"
    MEDICAL_SERVICES = "Medical Services"
    MENTAL_HEALTH = "Mental Health"
    DRUG_TREATMENT = "Drug Treatment"
    FINANCIAL_PLANNING = "Financial Planning"
    LEGAL_ASSISTANCE = "Legal Assistance"
    TRANSPORTATION = "Transportation"


class PopulationEnum(StrEnum):
    ADULTS = "Adults"
    MEN = "Men"
    WOMEN = "Women"
    FAMILIES = "Families"
    YOUTH = "Youth"
    BOYS = "Boys"
    GIRLS = "Girls"
    SENIORS = "Seniors"
    VETERANS = "Veterans"
    LGBTQ = "LGBTQ"


class RequirementEnum(StrEnum):
    PHOTO_ID = "Photo ID"
    MEDICAID_OR_MEDICARE = "Medicaid or Medicare"
    VETERAN = "Veteran"

    # TODO - does this belong in how to enter?
    RESERVATION = "Reservation"
    REFERRAL = "Referral"


class HowToEnterEnum(StrEnum):
    CALL = "Call"
    REFERRAL = "Referral"
    WALK_IN = "Walk-In"


class BedStateEnum(StrEnum):
    RESERVED = "Reserved"
    OCCUPIED = "Occupied"
    EMPTY = "Empty"
