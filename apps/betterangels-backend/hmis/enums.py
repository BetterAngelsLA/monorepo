import strawberry
from django.db import models


@strawberry.enum
class HmisSsnQualityEnum(models.IntegerChoices):
    FULL = 1, "Full SSN Reported"
    PARTIAL = 2, "Approximate or partial SSN reported"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisNameQualityEnum(models.IntegerChoices):
    FULL = 1, "Full name reported"
    PARTIAL = 2, "Partial, street name, or code name reported"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisDobQualityEnum(models.IntegerChoices):
    FULL = 1, "Full DOB Reported"
    PARTIAL = 2, "Approximate or partial DOB reported"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisSuffixEnum(models.IntegerChoices):
    JR = 1, "Jr."
    SR = 2, "Sr."
    FIRST = 3, "I"
    SECOND = 4, "II"
    THIRD = 5, "III"
    FOURTH = 6, "IV"
    FIFTH = 7, "V"
    SIXTH = 10, "VI"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"


@strawberry.enum
class HmisGenderEnum(models.IntegerChoices):
    WOMAN_GIRL = 0, "Woman (Girl, if child)"
    MAN_BOY = 1, "Man (Boy, if child)"
    SPECIFIC = 2, "Culturally Specific Identity (e.g., Two-Spirit)"
    TRANSGENDER = 5, "Transgender"
    NON_BINARY = 4, "Non-Binary"
    QUESTIONING = 6, "Questioning"
    DIFFERENT = 3, "Different Identity"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisRaceEnum(models.IntegerChoices):
    INDIGENOUS = 1, "American Indian, Alaska Native, or Indigenous"
    ASIAN = 2, "Asian or Asian American"
    BLACK = 3, "Black, African American, or African"
    HISPANIC = 6, "Hispanic/Latina/o"
    MIDDLE_EASTERN = 7, "Middle Eastern or North African"
    PACIFIC_ISLANDER = 4, "Native Hawaiian or Pacific Islander"
    WHITE = 5, "White"
    DONT_KNOW = 8, "Client doesn’t know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisVeteranStatusEnum(models.IntegerChoices):
    NO = 0, "No"
    YES = 1, "Yes"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisVeteranTheaterEnum(models.IntegerChoices):
    NO = 0, "No"
    YES = 1, "Yes"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisBranchEnum(models.IntegerChoices):
    ARMY = 1, "Army"
    AIR_FORCE = 2, "Air Force"
    NAVY = 3, "Navy"
    MARINES = 4, "Marines"
    COAST_GUARD = 6, "Coast Guard"
    SPACE_FORCE = 7, "Space Force"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"


@strawberry.enum
class HmisDischargeEnum(models.IntegerChoices):
    HONORABLE = 1, "Honorable"
    GENERAL_HONORABLE = 2, "General under honorable conditions"
    OTHER_THAN_HONORABLE = 6, "Under other than honorable conditions (OTH"
    BAD_CONDUCT = 4, "Bad Conduct"
    DISHONORABLE = 5, "Dishonorable"
    UNCHARACTERIZED = 7, "Uncharacterized"
    DONT_KNOW = 8, "Client doesn't know"
    NO_ANSWER = 9, "Client prefers not to answer"
    NOT_COLLECTED = 99, "Data not collected"
