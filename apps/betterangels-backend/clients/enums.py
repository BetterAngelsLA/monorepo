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

    OTHER_CLIENT_DOCUMENT = "other_client_document", "Other Client Document"


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
    MALE = "male", _("Male")
    FEMALE = "female", _("Female")
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
    LONG_BEACH = "long_beach", ("Long Beach")
    PASADENA = "pasadena", _("Pasadena")
    CHAMP = "champ", _("CHAMP")
    VASH = "vash", _("VASH")


@strawberry.enum
class LanguageEnum(models.TextChoices):
    ASL = "asl", _("American Sign Language")
    ARABIC = "arabic", _("Arabic")
    ARMENIAN = "armenian", _("Armenian")
    ENGLISH = "english", _("English")
    FARSI = "farsi", _("Farsi")
    FRENCH = "french", _("French")
    INDONESIAN = "indonesian", _("Indonesian")
    JAPANESE = "japanese", _("Japanese")
    KHMER = "khmer", _("Khmer")
    KOREAN = "korean", _("Korean")
    RUSSIAN = "russian", _("Russian")
    SIMPLIFIED_CHINESE = "simplified_chinese", _("Simplified Chinese")
    SPANISH = "spanish", _("Spanish")
    TAGALOG = "tagalog", _("Tagalog")
    TRADITIONAL_CHINESE = "traditional_chinese", _("Traditional Chinese")
    VIETNAMESE = "vietnamese", _("Vietnamese")


@strawberry.enum
class LivingSituationEnum(models.TextChoices):
    HOUSING = "housing", _("Housing")
    OPEN_AIR = "open_air", _("Open Air")
    SHELTER = "shelter", _("Shelter")
    TENT = "tent", _("Tent")
    VEHICLE = "vehicle", _("Vehicle")
    OTHER = "other", _("Other")


class MaritalStatusEnum(models.TextChoices):
    DIVORCED = "divorced", _("Divorced")
    MARRIED = "married", _("Married")
    SEPARATED = "separated", _("Separated")
    SINGLE = "single", _("Single")
    WIDOWED = "widowed", _("Widowed")


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


class VeteranStatusEnum(models.TextChoices):
    YES = "yes", _("Yes")
    NO = "no", _("No")
    PREFER_NOT_TO_SAY = "prefer_not_to_say", _("Prefer not to say")
    OTHER_THAN_HONORABLE = "other_than_honorable", _("Other than Honorable Discharge")
