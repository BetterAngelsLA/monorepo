import strawberry
from django.db import models
from django.utils.translation import gettext_lazy as _


class ErrorCodeEnum(models.TextChoices):
    CA_ID_INVALID = "ca_id_invalid", _("California ID invalid")
    CA_ID_IN_USE = "ca_id_in_use", _("California ID is already in use")
    EMAIL_INVALID = "email_invalid", _("Email invalid")
    EMAIL_IN_USE = "email_in_use", _("Email is already in use")
    HMIS_ID_IN_USE = "hmis_id_in_use", _("HMIS ID is already in use")
    HMIS_ID_NOT_PROVIDED = "hmis_id_not_provided", _("HMIS ID not provided")
    NAME_NOT_PROVIDED = "name_not_provided", _("Name not provided")
    PHONE_NUMBER_INVALID = "phone_number_invalid", _("Phone number invalid")


@strawberry.enum
class AdaAccommodationEnum(models.TextChoices):
    HEARING = "hearing", _("Hearing")
    MOBILITY = "mobility", _("Mobility")
    VISUAL = "visual", _("Visual")
    OTHER = "other", _("Other")


@strawberry.enum
class ClientDocumentNamespaceEnum(models.TextChoices):
    DRIVERS_LICENSE_FRONT = "drivers_license_front", "Driver's License Front"
    DRIVERS_LICENSE_BACK = "drivers_license_back", "Driver's License Back"
    PHOTO_ID = "photo_id", "Photo ID"
    BIRTH_CERTIFICATE = "birth_certificate", "Birth Certificate"
    SOCIAL_SECURITY_CARD = "social_security_card", "Social Security Card"
    OTHER_DOC_READY = "other_doc_ready", "Other Doc-Ready"

    CONSENT_FORM = "consent_form", "Consent Form"
    HMIS_FORM = "hmis_form", "HMIS Form"
    INCOME_FORM = "income_form", "Income Form"
    OTHER_FORM = "other_form", "Other Form"

    INCOME_DOCUMENTS = "income_documents", "Income Documents"
    OTHER_CLIENT_DOCUMENT = "other_client_document", "Other Client Document"
    CLIENT_UPLOAD = "client_upload", "Client Upload"


@strawberry.enum
class ClientDocumentGroupEnum(models.TextChoices):
    DOC_READY = "doc_ready", "Doc Ready"
    FORMS = "forms", "Forms"
    OTHER = "other", "Other"


class EyeColorEnum(models.TextChoices):
    BLUE = "blue", _("Blue")
    BROWN = "brown", _("Brown")
    GREEN = "green", _("Green")
    GRAY = "gray", _("Gray")
    HAZEL = "hazel", _("Hazel")
    OTHER = "other", _("Other")


class GenderEnum(models.TextChoices):
    CIS_MALE = "cis_male", _("Cis Male")
    CIS_FEMALE = "cis_female", _("Cis Female")
    TRANS_MALE = "trans_male", _("Transgender Male")
    TRANS_FEMALE = "trans_female", _("Transgender Female")
    NON_BINARY = "non_binary", _("Non-binary")
    OTHER = "other", _("Other")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")


class HairColorEnum(models.TextChoices):
    BLACK = "black", _("Black")
    BLONDE = "blonde", _("Blonde")
    BROWN = "brown", _("Brown")
    GRAY = "gray", _("Gray")
    RED = "red", _("Red")
    WHITE = "white", _("White")
    BALD = "bald", _("Bald")
    OTHER = "other", _("Other")


class HmisAgencyEnum(models.TextChoices):
    LAHSA = "lahsa", _("LAHSA")
    LONG_BEACH = "long_beach", _("Long Beach")
    PASADENA = "pasadena", _("Pasadena")
    CHAMP = "champ", _("CHAMP")
    VASH = "vash", _("VASH")
    OTHER = "other", _("Other")


@strawberry.enum
class LanguageEnum(models.TextChoices):
    ASL = "asl", _("American Sign Language")
    ARABIC = "arabic", _("Arabic")
    ARMENIAN = "armenian", _("Armenian")
    CANTONESE = "cantonese", _("Cantonese")
    ENGLISH = "english", _("English")
    FARSI = "farsi", _("Farsi")
    FRENCH = "french", _("French")
    INDONESIAN = "indonesian", _("Indonesian")
    JAPANESE = "japanese", _("Japanese")
    KHMER = "khmer", _("Khmer")
    KOREAN = "korean", _("Korean")
    MANDARIN = "mandarin", _("Mandarin")
    RUSSIAN = "russian", _("Russian")
    SIMPLIFIED_CHINESE = "simplified_chinese", _("Simplified Chinese")
    SPANISH = "spanish", _("Spanish")
    TAGALOG = "tagalog", _("Tagalog")
    TRADITIONAL_CHINESE = "traditional_chinese", _("Traditional Chinese")
    VIETNAMESE = "vietnamese", _("Vietnamese")
    OTHER = "other", _("Other")


@strawberry.enum
class LivingSituationEnum(models.TextChoices):
    """Prior living situation options."""

    RENTAL_OR_OWNED_HOME = "rental_or_owned_home", _("Rental or Owned Home")
    INFORMALLY_HOUSED = "informally_housed", _("Informally Housed")
    ANOTHER_SHELTER = "another_shelter", _("Another Shelter")
    MEDICAL_FACILITY = "medical_facility", _("Medical Facility")
    TENT = "tent", _("Tent")
    VEHICLE = "vehicle", _("Vehicle")
    OPEN_AIR = "open_air", _("Open air")
    JUSTICE_INVOLVED = "justice_involved", _("Justice Involved")
    UNKNOWN = "unknown", _("Unknown")
    OTHER = "other", _("Other")
    # Legacy values for backward compatibility
    HOUSING = "housing", _("Housing")
    SHELTER = "shelter", _("Shelter")


class MaritalStatusEnum(models.TextChoices):
    DIVORCED = "divorced", _("Divorced")
    MARRIED = "married", _("Married")
    SEPARATED = "separated", _("Separated")
    SINGLE = "single", _("Single")
    WIDOWED = "widowed", _("Widowed")


@strawberry.enum
class SexualOrientationEnum(models.TextChoices):
    ASEXUAL = "asexual", _("Asexual")
    BISEXUAL = "bisexual", _("Bisexual")
    GAY = "gay", _("Gay")
    STRAIGHT = "straight", _("Straight (heterosexual)")
    LESBIAN = "lesbian", _("Lesbian")
    PANSEXUAL = "pansexual", _("Pansexual")
    QUEER = "queer", _("Queer")
    OTHER = "other", _("Other")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer Not to Say")


@strawberry.enum
class PreferredCommunicationEnum(models.TextChoices):
    CALL = "call", _("Call")
    EMAIL = "email", _("Email")
    FACEBOOK = "facebook", _("Facebook")
    INSTAGRAM = "instagram", _("Instagram")
    LINKEDIN = "linkedin", _("LinkedIn")
    TEXT = "text", _("Text")
    WHATSAPP = "whatsapp", _("WhatsApp")


class PronounEnum(models.TextChoices):
    HE_HIM_HIS = "he_him_his", _("He/Him")
    SHE_HER_HERS = "she_her_hers", _("She/Her")
    THEY_THEM_THEIRS = "they_them_theirs", _("They/Them")
    OTHER = "other", _("Other")


class RaceEnum(models.TextChoices):
    AMERICAN_INDIAN_ALASKA_NATIVE = "american_indian_alaska_native", _("American Indian/Alaska Native")
    ASIAN = "asian", _("Asian")
    BLACK_AFRICAN_AMERICAN = "black_african_american", _("Black/African American")
    HISPANIC_LATINO = "hispanic_latino", _("Hispanic/Latino")
    NATIVE_HAWAIIAN_PACIFIC_ISLANDER = "native_hawaiian_pacific_islander", _("Native Hawaiian/Pacific Islander")
    WHITE_CAUCASIAN = "white_caucasian", _("White/Caucasian")
    OTHER = "other", _("Other")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")


class RelationshipTypeEnum(models.TextChoices):
    CURRENT_CASE_MANAGER = "current_case_manager", _("Current Case Manager")
    PAST_CASE_MANAGER = "past_case_manager", _("Past Case Manager")
    ORGANIZATION = "organization", _("Organization")
    AUNT = "aunt", _("Aunt")
    CHILD = "child", _("Child")
    COUSIN = "cousin", _("Cousin")
    FATHER = "father", _("Father")
    FRIEND = "friend", _("Friend")
    GRANDPARENT = "grandparent", _("Grandparent")
    MOTHER = "mother", _("Mother")
    PET = "pet", _("Pet")
    SIBLING = "sibling", _("Sibling")
    UNCLE = "uncle", _("Uncle")
    OTHER = "other", _("Other")


class SocialMediaEnum(models.TextChoices):
    FACEBOOK = "facebook", _("Facebook")
    INSTAGRAM = "instagram", _("Instagram")
    LINKEDIN = "linkedin", _("LinkedIn")
    SNAPCHAT = "snapchat", _("Snapchat")
    TIKTOK = "tiktok", _("TikTok")
    TWITTER = "twitter", _("Twitter")
    WHATSAPP = "whatsapp", _("WhatsApp")
    OTHER = "other", _("Other")


class VeteranStatusEnum(models.TextChoices):
    YES = "yes", _("Yes")
    NO = "no", _("No")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")
    OTHER_THAN_HONORABLE = "other_than_honorable", _("Other than Honorable Discharge")


@strawberry.enum
class ClientStatusEnum(models.TextChoices):
    RESERVED = "reserved", _("Reserved")
    CHECKED_IN = "checked_in", _("Checked in")
    CHECKED_OUT = "checked_out", _("Checked out")


@strawberry.enum
class AdlCapacityEnum(models.TextChoices):
    LOW_CAPACITY = "low_capacity", _("Low-capacity")
    HIGH_CAPACITY = "high_capacity", _("High-capacity")


@strawberry.enum
class MedicalNeedsEnum(models.TextChoices):
    MEDICAL = "medical", _("Medical")
    MENTAL_HEALTH = "mental_health", _("Mental Health")
    SUBSTANCE_USE = "substance_use", _("Recent Substance or Substance Use")
    COGNITIVE_IMPAIRMENTS = "cognitive_impairments", _("Cognitive Impairments")
    NONE = "none", _("The participant does not have any of the above issues")


@strawberry.enum
class ClientPetsEnum(models.TextChoices):
    CATS = "cats", _("Cats")
    DOG = "dog", _("Dog")
    SERVICE_ANIMAL = "service_animal", _("Service Animal")
    OTHER = "other", _("Other")


@strawberry.enum
class ClientFundingSourceEnum(models.TextChoices):
    CITY_OF_LOS_ANGELES = "city_of_los_angeles", _("City of Los Angeles")
    CLIENT_FEES = "client_fees", _("Client Fees")
    DHS = "dhs", _("DHS")
    DMH = "dmh", _("DMH")
    FEDERAL_FUNDING = "federal_funding", _("Federal Funding")
    HOPWA = "hopwa", _("HOPWA")
    LAHSA = "lahsa", _("LAHSA")
    PRIVATE = "private", _("Private")
    VETERANS_AFFAIRS = "veterans_affairs", _("Veterans Affairs")
    OTHER = "other", _("Other")


@strawberry.enum
class ClientSpaEnum(models.IntegerChoices):
    ONE = 1, _("1 - Antelope Valley")
    TWO = 2, _("2 - San Fernando")
    THREE = 3, _("3 - San Gabriel")
    FOUR = 4, _("4 - Metro")
    FIVE = 5, _("5 - West")
    SIX = 6, _("6 - South")
    SEVEN = 7, _("7 - East")
    EIGHT = 8, _("8 - South Bay/Harbor")


@strawberry.enum
class DestinationEnum(models.TextChoices):
    OWN_HOME = "own_home", _("Own home")
    SHARED_HOME = "shared_home", _("Shared home")
    ANOTHER_SHELTER = "another_shelter", _("Another Shelter")
    MEDICAL_FACILITY = "medical_facility", _("Medical Facility")
    DECEASED = "deceased", _("Deceased")
    JUSTICE_INVOLVED = "justice_involved", _("Justice Involved")
    UNKNOWN = "unknown", _("Unknown")
    OTHER = "other", _("Other")
