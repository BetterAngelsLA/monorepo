from django.db import models
from django.utils.translation import gettext_lazy as _


# Organization-level permissions (on the Organization content type).
# Created in accounts/migrations/0046_add_shelter_operator_template.
class ShelterOrgPermissions(models.TextChoices):
    MANAGE_SHELTER = "organizations.manage_shelter", _("Can manage shelters")
    MANAGE_SHELTER_BEDS = "organizations.manage_shelter_beds", _("Can manage shelter beds and rooms")


class AccessibilityPermissions(models.TextChoices):
    ADD = "shelters.add_accessibility", _("Can add accessibility")
    CHANGE = "shelters.change_accessibility", _("Can change accessibility")
    DELETE = "shelters.delete_accessibility", _("Can delete accessibility")
    VIEW = "shelters.view_accessibility", _("Can view accessibility")


class BedPermissions(models.TextChoices):
    ADD = "shelters.add_bed", _("Can add bed")
    CHANGE = "shelters.change_bed", _("Can change bed")
    DELETE = "shelters.delete_bed", _("Can delete bed")
    VIEW = "shelters.view_bed", _("Can view bed")


class RoomPermissions(models.TextChoices):
    ADD = "shelters.add_room", _("Can add room")
    CHANGE = "shelters.change_room", _("Can change room")
    DELETE = "shelters.delete_room", _("Can delete room")
    VIEW = "shelters.view_room", _("Can view room")


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


class FunderPermissions(models.TextChoices):
    ADD = "shelters.add_funder", _("Can add funder")
    CHANGE = "shelters.change_funder", _("Can change funder")
    DELETE = "shelters.delete_funder", _("Can delete funder")
    VIEW = "shelters.view_funder", _("Can view funder")


class ShelterPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_shelterphoto", _("Can add shelter photo")
    CHANGE = "shelters.change_shelterphoto", _("Can change shelter photo")
    DELETE = "shelters.delete_shelterphoto", _("Can delete shelter photo")
    VIEW = "shelters.view_shelterphoto", _("Can view shelter photo")


class InteriorShelterPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_interiorshelterphoto", _("Can add interior shelter photo")
    CHANGE = "shelters.change_interiorshelterphoto", _("Can change interior shelter photo")
    DELETE = "shelters.delete_interiorshelterphoto", _("Can delete interior shelter photo")
    VIEW = "shelters.view_interiorshelterphoto", _("Can view interior shelter photo")


class ExteriorShelterPhotoPermissions(models.TextChoices):
    ADD = "shelters.add_exteriorshelterphoto", _("Can add exterior shelter photo")
    CHANGE = "shelters.change_exteriorshelterphoto", _("Can change exterior shelter photo")
    DELETE = "shelters.delete_exteriorshelterphoto", _("Can delete exterior shelter photo")
    VIEW = "shelters.view_exteriorshelterphoto", _("Can view exterior shelter photo")


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


class ShelterPrivacyPermissions(models.TextChoices):
    VIEW_PRIVATE = "shelters.view_private_shelter", _("Can view private shelters")


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


class SchedulePermissions(models.TextChoices):
    ADD = "shelters.add_schedule", _("Can add schedule")
    CHANGE = "shelters.change_schedule", _("Can change schedule")
    DELETE = "shelters.delete_schedule", _("Can delete schedule")
    VIEW = "shelters.view_schedule", _("Can view schedule")


class ReferralRequirementPermissions(models.TextChoices):
    ADD = "shelters.add_referralrequirement", _("Can add referral requirement")
    CHANGE = "shelters.change_referralrequirement", _("Can change referral requirement")
    DELETE = "shelters.delete_referralrequirement", _("Can delete referral requirement")
    VIEW = "shelters.view_referralrequirement", _("Can view referral requirement")


class ServicePermissions(models.TextChoices):
    ADD = "shelters.add_service", _("Can add service")
    CHANGE = "shelters.change_service", _("Can change service")
    DELETE = "shelters.delete_service", _("Can delete service")
    VIEW = "shelters.view_service", _("Can view service")


class ServiceCategoryPermissions(models.TextChoices):
    ADD = "shelters.add_servicecategory", _("Can add service category")
    CHANGE = "shelters.change_servicecategory", _("Can change service category")
    DELETE = "shelters.delete_servicecategory", _("Can delete service category")
    VIEW = "shelters.view_servicecategory", _("Can view service category")
