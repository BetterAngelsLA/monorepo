"""Proxy models for tracking ManyToManyField through tables with pghistory."""

import pghistory

from .shelter import Bed, Room, Shelter


@pghistory.track(
    pghistory.InsertEvent("shelter.demographic.add"),
    pghistory.DeleteEvent("shelter.demographic.remove"),
    obj_field=None,
)
class TrackedDemographic(Shelter.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.special_restriction.add"),
    pghistory.DeleteEvent("shelter.special_restriction.remove"),
    obj_field=None,
)
class TrackedSpecialSituationRestriction(Shelter.special_situation_restrictions.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_type.add"),
    pghistory.DeleteEvent("shelter.shelter_type.remove"),
    obj_field=None,
)
class TrackedShelterType(Shelter.shelter_types.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.room_style.add"),
    pghistory.DeleteEvent("shelter.room_style.remove"),
    obj_field=None,
)
class TrackedRoomStyle(Shelter.room_styles.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.accessibility.add"),
    pghistory.DeleteEvent("shelter.accessibility.remove"),
    obj_field=None,
)
class TrackedAccessibility(Shelter.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.storage.add"),
    pghistory.DeleteEvent("shelter.storage.remove"),
    obj_field=None,
)
class TrackedStorage(Shelter.storage.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.pet.add"),
    pghistory.DeleteEvent("shelter.pet.remove"),
    obj_field=None,
)
class TrackedPet(Shelter.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.parking.add"),
    pghistory.DeleteEvent("shelter.parking.remove"),
    obj_field=None,
)
class TrackedParking(Shelter.parking.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.entry_requirement.add"),
    pghistory.DeleteEvent("shelter.entry_requirement.remove"),
    obj_field=None,
)
class TrackedEntryRequirement(Shelter.entry_requirements.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.vaccination_requirement.add"),
    pghistory.DeleteEvent("shelter.vaccination_requirement.remove"),
    obj_field=None,
)
class TrackedVaccinationRequirement(Shelter.vaccination_requirement.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.city.add"),
    pghistory.DeleteEvent("shelter.city.remove"),
    obj_field=None,
)
class TrackedCity(Shelter.cities_served.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.spa.add"),
    pghistory.DeleteEvent("shelter.spa.remove"),
    obj_field=None,
)
class TrackedSPA(Shelter.spas_served.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_program.add"),
    pghistory.DeleteEvent("shelter.shelter_program.remove"),
    obj_field=None,
)
class TrackedShelterProgram(Shelter.shelter_programs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.funder.add"),
    pghistory.DeleteEvent("shelter.funder.remove"),
    obj_field=None,
)
class TrackedFunder(Shelter.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Remaining Shelter M2M joins ─────────────────────────────────────────────


@pghistory.track(
    pghistory.InsertEvent("shelter.exit_policy.add"),
    pghistory.DeleteEvent("shelter.exit_policy.remove"),
    obj_field=None,
)
class TrackedExitPolicy(Shelter.exit_policy.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.referral_requirement.add"),
    pghistory.DeleteEvent("shelter.referral_requirement.remove"),
    obj_field=None,
)
class TrackedReferralRequirement(Shelter.referral_requirement.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.service.add"),
    pghistory.DeleteEvent("shelter.service.remove"),
    obj_field=None,
)
class TrackedService(Shelter.services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Bed M2M joins (parent-prefixed to avoid colliding with Shelter proxies) ──


@pghistory.track(
    pghistory.InsertEvent("bed.accessibility.add"),
    pghistory.DeleteEvent("bed.accessibility.remove"),
    obj_field=None,
)
class TrackedBedAccessibility(Bed.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.demographic.add"),
    pghistory.DeleteEvent("bed.demographic.remove"),
    obj_field=None,
)
class TrackedBedDemographic(Bed.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.funder.add"),
    pghistory.DeleteEvent("bed.funder.remove"),
    obj_field=None,
)
class TrackedBedFunder(Bed.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.medical_need.add"),
    pghistory.DeleteEvent("bed.medical_need.remove"),
    obj_field=None,
)
class TrackedBedMedicalNeed(Bed.medical_needs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.pet.add"),
    pghistory.DeleteEvent("bed.pet.remove"),
    obj_field=None,
)
class TrackedBedPet(Bed.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Room M2M joins (parent-prefixed to avoid colliding with Shelter proxies) ─


@pghistory.track(
    pghistory.InsertEvent("room.accessibility.add"),
    pghistory.DeleteEvent("room.accessibility.remove"),
    obj_field=None,
)
class TrackedRoomAccessibility(Room.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.demographic.add"),
    pghistory.DeleteEvent("room.demographic.remove"),
    obj_field=None,
)
class TrackedRoomDemographic(Room.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.funder.add"),
    pghistory.DeleteEvent("room.funder.remove"),
    obj_field=None,
)
class TrackedRoomFunder(Room.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.pet.add"),
    pghistory.DeleteEvent("room.pet.remove"),
    obj_field=None,
)
class TrackedRoomPet(Room.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True
