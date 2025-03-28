from django.db import models
from django.utils.translation import gettext_lazy as _


class AccessibilityPermissions(models.TextChoices):
    ADD = "shelters.add_accessibility", _("Can add accessibility")
    CHANGE = "shelters.change_accessibility", _("Can change accessibility")
    DELETE = "shelters.delete_accessibility", _("Can delete accessibility")
    VIEW = "shelters.view_accessibility", _("Can view accessibility")


class CareerServicePermissions(models.TextChoices):
    ADD = "shelters.add_careerservice", _("Can add career service")
    CHANGE = "shelters.change_careerservice", _("Can change career service")
    DELETE = "shelters.delete_careerservice", _("Can delete career service")
    VIEW = "shelters.view_careerservice", _("Can view career service")


class ContactInfoPermissions(models.TextChoices):
    ADD = "shelters.add_contactinfo", _("Can add contact info")
    CHANGE = "shelters.change_contactinfo", _("Can change contact info")
    DELETE = "shelters.delete_contactinfo", _("Can delete contact info")
    VIEW = "shelters.view_contactinfo", _("Can view contact info")


class CityPermissions(models.TextChoices):
    ADD = "shelters.add_city", _("Can add city")
    CHANGE = "shelters.change_city", _("Can change city")
    DELETE = "shelters.delete_city", _("Can delete city")
    VIEW = "shelters.view_city", _("Can view city")


class DemographicPermissions(models.TextChoices):
    ADD = "shelters.add_demographic", _("Can add demographic")
    CHANGE = "shelters.change_demographic", _("Can change demographic")
    DELETE = "shelters.delete_demographic", _("Can delete demographic")
    VIEW = "shelters.view_demographic", _("Can view demographic")


class EntryRequirementPermissions(models.TextChoices):
    ADD = "shelters.add_entryrequirement", _("Can add entry requirement")
    CHANGE = "shelters.change_entryrequirement", _("Can change entry requirement")
    DELETE = "shelters.delete_entryrequirement", _("Can delete entry requirement")
    VIEW = "shelters.view_entryrequirement", _("Can view entry requirement")


class ExteriorPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_exteriorphoto", _("Can add exterior photo")
    CHANGE = "shelters.change_exteriorphoto", _("Can change exterior photo")
    DELETE = "shelters.delete_exteriorphoto", _("Can delete exterior photo")
    VIEW = "shelters.view_exteriorphoto", _("Can view exterior photo")


class FunderPermissions(models.TextChoices):
    ADD = "shelters.add_funder", _("Can add funder")
    CHANGE = "shelters.change_funder", _("Can change funder")
    DELETE = "shelters.delete_funder", _("Can delete funder")
    VIEW = "shelters.view_funder", _("Can view funder")


class GeneralServicePermissions(models.TextChoices):
    ADD = "shelters.add_generalservice", _("Can add general service")
    CHANGE = "shelters.change_generalservice", _("Can change general service")
    DELETE = "shelters.delete_generalservice", _("Can delete general service")
    VIEW = "shelters.view_generalservice", _("Can view general service")


class HealthServicePermissions(models.TextChoices):
    ADD = "shelters.add_healthservice", _("Can add health service")
    CHANGE = "shelters.change_healthservice", _("Can change health service")
    DELETE = "shelters.delete_healthservice", _("Can delete health service")
    VIEW = "shelters.view_healthservice", _("Can view health service")


class ImmediateNeedPermissions(models.TextChoices):
    ADD = "shelters.add_immediateneed", _("Can add immediate need")
    CHANGE = "shelters.change_immediateneed", _("Can change immediate need")
    DELETE = "shelters.delete_immediateneed", _("Can delete immediate need")
    VIEW = "shelters.view_immediateneed", _("Can view immediate need")


class InteriorPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_interiorphoto", _("Can add interior photo")
    CHANGE = "shelters.change_interiorphoto", _("Can change interior photo")
    DELETE = "shelters.delete_interiorphoto", _("Can delete interior photo")
    VIEW = "shelters.view_interiorphoto", _("Can view interior photo")


class ParkingPermissions(models.TextChoices):
    ADD = "shelters.add_parking", _("Can add parking")
    CHANGE = "shelters.change_parking", _("Can change parking")
    DELETE = "shelters.delete_parking", _("Can delete parking")
    VIEW = "shelters.view_parking", _("Can view parking")


class PetPermissions(models.TextChoices):
    ADD = "shelters.add_pet", _("Can add pet")
    CHANGE = "shelters.change_pet", _("Can change pet")
    DELETE = "shelters.delete_pet", _("Can delete pet")
    VIEW = "shelters.view_pet", _("Can view pet")


class PopulationPermissions(models.TextChoices):
    ADD = "shelters.add_population", _("Can add population")
    CHANGE = "shelters.change_population", _("Can change population")
    DELETE = "shelters.delete_population", _("Can delete population")
    VIEW = "shelters.view_population", _("Can view population")


class RoomStylePermissions(models.TextChoices):
    ADD = "shelters.add_roomstyle", _("Can add room style")
    CHANGE = "shelters.change_roomstyle", _("Can change room style")
    DELETE = "shelters.delete_roomstyle", _("Can delete room style")
    VIEW = "shelters.view_roomstyle", _("Can view room style")


class ShelterPermissions(models.TextChoices):
    ADD = "shelters.add_shelter", _("Can add shelter")
    CHANGE = "shelters.change_shelter", _("Can change shelter")
    DELETE = "shelters.delete_shelter", _("Can delete shelter")
    VIEW = "shelters.view_shelter", _("Can view shelter")


class ShelterFieldPermissions(models.TextChoices):
    CHANGE_IS_REVIEWED = "shelters.change_shelter_is_reviewed", _("Can change shelter is reviewed")


class ShelterTypePermissions(models.TextChoices):
    ADD = "shelters.add_sheltertype", _("Can add shelter type")
    CHANGE = "shelters.change_sheltertype", _("Can change shelter type")
    DELETE = "shelters.delete_sheltertype", _("Can delete shelter type")
    VIEW = "shelters.view_sheltertype", _("Can view shelter type")


class ShelterProgramPermissions(models.TextChoices):
    ADD = "shelters.add_shelterprogram", _("Can add shelter program")
    CHANGE = "shelters.change_shelterprogram", _("Can change shelter program")
    DELETE = "shelters.delete_shelterprogram", _("Can delete shelter program")
    VIEW = "shelters.view_shelterprogram", _("Can view shelter program")


class SleepingOptionPermissions(models.TextChoices):
    ADD = "shelters.add_sleepingoption", _("Can add sleeping option")
    CHANGE = "shelters.change_sleepingoption", _("Can change sleeping option")
    DELETE = "shelters.delete_sleepingoption", _("Can delete sleeping option")
    VIEW = "shelters.view_sleepingoption", _("Can view sleeping option")


class SpaPermissions(models.TextChoices):
    ADD = "shelters.add_spa", _("Can add spa")
    CHANGE = "shelters.change_spa", _("Can change spa")
    DELETE = "shelters.delete_spa", _("Can delete spa")
    VIEW = "shelters.view_spa", _("Can view spa")


class SpecialSituationRestrictionPermissions(models.TextChoices):
    ADD = "shelters.add_specialsituationrestriction", _("Can add special situation restriction")
    CHANGE = "shelters.change_specialsituationrestriction", _("Can change special situation restriction")
    DELETE = "shelters.delete_specialsituationrestriction", _("Can delete special situation restriction")
    VIEW = "shelters.view_specialsituationrestriction", _("Can view special situation restriction")


class StoragePermissions(models.TextChoices):
    ADD = "shelters.add_storage", _("Can add storage")
    CHANGE = "shelters.change_storage", _("Can change storage")
    DELETE = "shelters.delete_storage", _("Can delete storage")
    VIEW = "shelters.view_storage", _("Can view storage")


class TrainingServicePermissions(models.TextChoices):
    ADD = "shelters.add_trainingservice", _("Can add training service")
    CHANGE = "shelters.change_trainingservice", _("Can change training service")
    DELETE = "shelters.delete_trainingservice", _("Can delete training service")
    VIEW = "shelters.view_trainingservice", _("Can view training service")


class VideoPermissions(models.TextChoices):
    ADD = "shelters.add_video", _("Can add video")
    CHANGE = "shelters.change_video", _("Can change video")
    DELETE = "shelters.delete_video", _("Can delete video")
    VIEW = "shelters.view_video", _("Can view video")


class ExitPolicyPermissions(models.TextChoices):
    ADD = "shelters.add_exitpolicy", _("Can add exit policy")
    CHANGE = "shelters.change_exitpolicy", _("Can change exit policy")
    DELETE = "shelters.delete_exitpolicy", _("Can delete exit policy")
    VIEW = "shelters.view_exitpolicy", _("Can view exit policy")


class MealServicePermissions(models.TextChoices):
    ADD = "shelters.add_mealservice", _("Can add meal service")
    CHANGE = "shelters.change_mealservice", _("Can change meal service")
    DELETE = "shelters.delete_mealservice", _("Can delete meal service")
    VIEW = "shelters.view_mealservice", _("Can view meal service")


class ReferralRequirementPermissions(models.TextChoices):
    ADD = "shelters.add_referralrequirement", _("Can add referral requirement")
    CHANGE = "shelters.change_referralrequirement", _("Can change referral requirement")
    DELETE = "shelters.delete_referralrequirement", _("Can delete referral requirement")
    VIEW = "shelters.view_referralrequirement", _("Can view referral requirement")
