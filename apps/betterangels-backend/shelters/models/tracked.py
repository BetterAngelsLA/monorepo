"""Proxy models for tracking ManyToManyField through tables with pghistory."""

import pghistory

from .shelter import Shelter


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
class TrackedVaccination(Shelter.vaccination_requirement.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.city.add"),
    pghistory.DeleteEvent("shelter.city.remove"),
    obj_field=None,
)
class TrackedCity(Shelter.cities.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.spa.add"),
    pghistory.DeleteEvent("shelter.spa.remove"),
    obj_field=None,
)
class TrackedSPA(Shelter.spa.through):  # type: ignore[name-defined]
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
