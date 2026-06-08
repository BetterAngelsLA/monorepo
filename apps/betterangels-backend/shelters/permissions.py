import strawberry
from common.permissions.utils import perms_to_text_choices
from django.db import models
from django.utils.translation import gettext_lazy as _

from .models import (
    Accessibility,
    Bed,
    City,
    ContactInfo,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    ExteriorShelterPhoto,
    Funder,
    InteriorShelterPhoto,
    MedicalNeed,
    Parking,
    Pet,
    ReferralRequirement,
    Room,
    RoomStyle,
    Schedule,
    Service,
    ServiceCategory,
    SPA,
    Shelter,
    ShelterPhoto,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    VaccinationRequirement,
    Video,
)

# ── Model-backed permission enums ─────────────────────────────────────────────
# These TextChoices classes exist solely to register types with Strawberry's
# GraphQL type system (schema introspection, make_granted_permissions, etc.).
#
# For IDE autocomplete on individual permission values, use the model's .perms:
#     Shelter.perms.ADD            → "shelters.add_shelter"
#     Shelter.perms.VIEW_PRIVATE   → "shelters.view_private_shelter"
# ──────────────────────────────────────────────────────────────────────────────

AccessibilityPermissions = perms_to_text_choices(Accessibility)
BedPermissions = perms_to_text_choices(Bed)
CityPermissions = perms_to_text_choices(City)
ContactInfoPermissions = perms_to_text_choices(ContactInfo)
DemographicPermissions = perms_to_text_choices(Demographic)
EntryRequirementPermissions = perms_to_text_choices(EntryRequirement)
ExitPolicyPermissions = perms_to_text_choices(ExitPolicy)
ExteriorShelterPhotoPermissions = perms_to_text_choices(ExteriorShelterPhoto)
FunderPermissions = perms_to_text_choices(Funder)
InteriorShelterPhotoPermissions = perms_to_text_choices(InteriorShelterPhoto)
MedicalNeedPermissions = perms_to_text_choices(MedicalNeed)
ParkingPermissions = perms_to_text_choices(Parking)
PetPermissions = perms_to_text_choices(Pet)
ReferralRequirementPermissions = perms_to_text_choices(ReferralRequirement)
RoomPermissions = perms_to_text_choices(Room)
RoomStylePermissions = perms_to_text_choices(RoomStyle)
SchedulePermissions = perms_to_text_choices(Schedule)
ServicePermissions = perms_to_text_choices(Service)
ServiceCategoryPermissions = perms_to_text_choices(ServiceCategory)
ShelterPhotoPermissions = perms_to_text_choices(ShelterPhoto)
ShelterProgramPermissions = perms_to_text_choices(ShelterProgram)
ShelterTypePermissions = perms_to_text_choices(ShelterType)
SpaPermissions = perms_to_text_choices(SPA)
SpecialSituationRestrictionPermissions = perms_to_text_choices(SpecialSituationRestriction)
StoragePermissions = perms_to_text_choices(Storage)
VaccinationRequirementPermissions = perms_to_text_choices(VaccinationRequirement)
VideoPermissions = perms_to_text_choices(Video)

# ── Strawberry-decorated ShelterPermissions (includes custom perms) ───────────

ShelterPermissions = strawberry.enum(perms_to_text_choices(Shelter))

# ── Field-level permissions (no backing model) ────────────────────────────────

class ShelterPrivacyPermissions(models.TextChoices):
    VIEW_PRIVATE = "shelters.view_private_shelter", _("Can view private shelters")


class ShelterFieldPermissions(models.TextChoices):
    CHANGE_IS_REVIEWED = "shelters.change_shelter_is_reviewed", _("Can change shelter is reviewed")