import strawberry
from common.permissions.utils import permissions_enum_from_model
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

AccessibilityPermissions = permissions_enum_from_model(Accessibility)
BedPermissions = permissions_enum_from_model(Bed)
CityPermissions = permissions_enum_from_model(City)
ContactInfoPermissions = permissions_enum_from_model(ContactInfo)
DemographicPermissions = permissions_enum_from_model(Demographic)
EntryRequirementPermissions = permissions_enum_from_model(EntryRequirement)
ExitPolicyPermissions = permissions_enum_from_model(ExitPolicy)
ExteriorShelterPhotoPermissions = permissions_enum_from_model(ExteriorShelterPhoto)
FunderPermissions = permissions_enum_from_model(Funder)
InteriorShelterPhotoPermissions = permissions_enum_from_model(InteriorShelterPhoto)
MedicalNeedPermissions = permissions_enum_from_model(MedicalNeed)
ParkingPermissions = permissions_enum_from_model(Parking)
PetPermissions = permissions_enum_from_model(Pet)
ReferralRequirementPermissions = permissions_enum_from_model(ReferralRequirement)
RoomPermissions = permissions_enum_from_model(Room)
RoomStylePermissions = permissions_enum_from_model(RoomStyle)
SchedulePermissions = permissions_enum_from_model(Schedule)
ServicePermissions = permissions_enum_from_model(Service)
ServiceCategoryPermissions = permissions_enum_from_model(ServiceCategory)
ShelterPhotoPermissions = permissions_enum_from_model(ShelterPhoto)
ShelterProgramPermissions = permissions_enum_from_model(ShelterProgram)
ShelterTypePermissions = permissions_enum_from_model(ShelterType)
SpaPermissions = permissions_enum_from_model(SPA)
SpecialSituationRestrictionPermissions = permissions_enum_from_model(SpecialSituationRestriction)
StoragePermissions = permissions_enum_from_model(Storage)
VaccinationRequirementPermissions = permissions_enum_from_model(VaccinationRequirement)
VideoPermissions = permissions_enum_from_model(Video)

# ── Strawberry-decorated ShelterPermissions (includes custom perms) ───────────

ShelterPermissions: type[models.TextChoices] = permissions_enum_from_model(Shelter)
strawberry.enum(ShelterPermissions)  # register with Strawberry for GraphQL schema

# ── Field-level permissions (no backing model) ────────────────────────────────


class ShelterPrivacyPermissions(models.TextChoices):
    VIEW_PRIVATE = "shelters.view_private_shelter", _("Can view private shelters")


class ShelterFieldPermissions(models.TextChoices):
    CHANGE_IS_REVIEWED = "shelters.change_shelter_is_reviewed", _("Can change shelter is reviewed")
