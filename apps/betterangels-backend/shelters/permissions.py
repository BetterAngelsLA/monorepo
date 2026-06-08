import strawberry
from common.permissions.utils import model_permissions
from django.db import models
from django.utils.translation import gettext_lazy as _

from .models import (
    SPA,
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

AccessibilityPermissions = model_permissions(Accessibility)
BedPermissions = model_permissions(Bed)
CityPermissions = model_permissions(City)
ContactInfoPermissions = model_permissions(ContactInfo)
DemographicPermissions = model_permissions(Demographic)
EntryRequirementPermissions = model_permissions(EntryRequirement)
ExitPolicyPermissions = model_permissions(ExitPolicy)
ExteriorShelterPhotoPermissions = model_permissions(ExteriorShelterPhoto)
FunderPermissions = model_permissions(Funder)
InteriorShelterPhotoPermissions = model_permissions(InteriorShelterPhoto)
MedicalNeedPermissions = model_permissions(MedicalNeed)
ParkingPermissions = model_permissions(Parking)
PetPermissions = model_permissions(Pet)
ReferralRequirementPermissions = model_permissions(ReferralRequirement)
RoomPermissions = model_permissions(Room)
RoomStylePermissions = model_permissions(RoomStyle)
SchedulePermissions = model_permissions(Schedule)
ServicePermissions = model_permissions(Service)
ServiceCategoryPermissions = model_permissions(ServiceCategory)
ShelterPhotoPermissions = model_permissions(ShelterPhoto)
ShelterProgramPermissions = model_permissions(ShelterProgram)
ShelterTypePermissions = model_permissions(ShelterType)
SpaPermissions = model_permissions(SPA)
SpecialSituationRestrictionPermissions = model_permissions(SpecialSituationRestriction)
StoragePermissions = model_permissions(Storage)
VaccinationRequirementPermissions = model_permissions(VaccinationRequirement)
VideoPermissions = model_permissions(Video)

# ── Strawberry-decorated ShelterPermissions (includes custom perms) ───────────

ShelterPermissions = strawberry.enum(model_permissions(Shelter))

# ── Field-level permissions (no backing model) ────────────────────────────────


class ShelterPrivacyPermissions(models.TextChoices):
    VIEW_PRIVATE = "shelters.view_private_shelter", _("Can view private shelters")


class ShelterFieldPermissions(models.TextChoices):
    CHANGE_IS_REVIEWED = "shelters.change_shelter_is_reviewed", _("Can change shelter is reviewed")
