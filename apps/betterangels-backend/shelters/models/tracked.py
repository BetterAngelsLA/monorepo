"""Proxy models for tracking ManyToManyField through tables with pghistory."""

import hashlib
from typing import Any

import pghistory
from django.db import models

from .shelter import Bed, Room, Shelter


def _index_slug(slug: str) -> str:
    """Keep an index name within Django's 30-character cross-backend limit.

    Long model names are hashed rather than silently colliding after truncation,
    so each event table still gets a unique, deterministic name.
    """
    if len(slug) <= 18:
        return slug
    return f"{slug[:11]}_{hashlib.sha1(slug.encode()).hexdigest()[:6]}"


def _event_meta(slug: str, parent_field: str) -> dict[str, Any]:
    """Indexes for a through-table event model (ADR 0004 §10).

    The audit selector reaches a through event table through its parent FK
    (``references(shelter=...)`` filters on ``shelter_id``) and then pages on
    ``pgh_id``, so ``(parent_fk, pgh_id)`` serves the whole branch. Retention
    filters on ``pgh_created_at``, which the second index serves.
    """
    name = _index_slug(slug)
    return {
        "indexes": [
            models.Index(fields=[parent_field, "pgh_id"], name=f"{name}_evt_fk_idx"),
            models.Index(fields=["pgh_created_at"], name=f"{name}_evt_ca_idx"),
        ]
    }


@pghistory.track(
    pghistory.InsertEvent("shelter.demographic.add"),
    pghistory.DeleteEvent("shelter.demographic.remove"),
    obj_field=None,
    meta=_event_meta("shelter_demographic", "shelter"),
)
class TrackedDemographic(Shelter.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.special_restriction.add"),
    pghistory.DeleteEvent("shelter.special_restriction.remove"),
    obj_field=None,
    meta=_event_meta("shelter_special_restriction", "shelter"),
)
class TrackedSpecialSituationRestriction(Shelter.special_situation_restrictions.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_type.add"),
    pghistory.DeleteEvent("shelter.shelter_type.remove"),
    obj_field=None,
    meta=_event_meta("shelter_shelter_type", "shelter"),
)
class TrackedShelterType(Shelter.shelter_types.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.room_style.add"),
    pghistory.DeleteEvent("shelter.room_style.remove"),
    obj_field=None,
    meta=_event_meta("shelter_room_style", "shelter"),
)
class TrackedRoomStyle(Shelter.room_styles.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.accessibility.add"),
    pghistory.DeleteEvent("shelter.accessibility.remove"),
    obj_field=None,
    meta=_event_meta("shelter_accessibility", "shelter"),
)
class TrackedAccessibility(Shelter.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.storage.add"),
    pghistory.DeleteEvent("shelter.storage.remove"),
    obj_field=None,
    meta=_event_meta("shelter_storage", "shelter"),
)
class TrackedStorage(Shelter.storage.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.pet.add"),
    pghistory.DeleteEvent("shelter.pet.remove"),
    obj_field=None,
    meta=_event_meta("shelter_pet", "shelter"),
)
class TrackedPet(Shelter.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.parking.add"),
    pghistory.DeleteEvent("shelter.parking.remove"),
    obj_field=None,
    meta=_event_meta("shelter_parking", "shelter"),
)
class TrackedParking(Shelter.parking.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.entry_requirement.add"),
    pghistory.DeleteEvent("shelter.entry_requirement.remove"),
    obj_field=None,
    meta=_event_meta("shelter_entry_requirement", "shelter"),
)
class TrackedEntryRequirement(Shelter.entry_requirements.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.vaccination_requirement.add"),
    pghistory.DeleteEvent("shelter.vaccination_requirement.remove"),
    obj_field=None,
    meta=_event_meta("shelter_vaccination_requirement", "shelter"),
)
class TrackedVaccinationRequirement(Shelter.vaccination_requirement.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.city.add"),
    pghistory.DeleteEvent("shelter.city.remove"),
    obj_field=None,
    meta=_event_meta("shelter_city", "shelter"),
)
class TrackedCity(Shelter.cities_served.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.spa.add"),
    pghistory.DeleteEvent("shelter.spa.remove"),
    obj_field=None,
    meta=_event_meta("shelter_spa", "shelter"),
)
class TrackedSPA(Shelter.spas_served.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_program.add"),
    pghistory.DeleteEvent("shelter.shelter_program.remove"),
    obj_field=None,
    meta=_event_meta("shelter_program", "shelter"),
)
class TrackedShelterProgram(Shelter.shelter_programs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.funder.add"),
    pghistory.DeleteEvent("shelter.funder.remove"),
    obj_field=None,
    meta=_event_meta("shelter_funder", "shelter"),
)
class TrackedFunder(Shelter.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Remaining Shelter M2M joins ─────────────────────────────────────────────


@pghistory.track(
    pghistory.InsertEvent("shelter.exit_policy.add"),
    pghistory.DeleteEvent("shelter.exit_policy.remove"),
    obj_field=None,
    meta=_event_meta("shelter_exit_policy", "shelter"),
)
class TrackedExitPolicy(Shelter.exit_policy.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.referral_requirement.add"),
    pghistory.DeleteEvent("shelter.referral_requirement.remove"),
    obj_field=None,
    meta=_event_meta("shelter_referral_requirement", "shelter"),
)
class TrackedReferralRequirement(Shelter.referral_requirement.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.service.add"),
    pghistory.DeleteEvent("shelter.service.remove"),
    obj_field=None,
    meta=_event_meta("shelter_service", "shelter"),
)
class TrackedService(Shelter.services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Bed M2M joins (parent-prefixed to avoid colliding with Shelter proxies) ──


@pghistory.track(
    pghistory.InsertEvent("bed.accessibility.add"),
    pghistory.DeleteEvent("bed.accessibility.remove"),
    obj_field=None,
    meta=_event_meta("bed_accessibility", "bed"),
)
class TrackedBedAccessibility(Bed.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.demographic.add"),
    pghistory.DeleteEvent("bed.demographic.remove"),
    obj_field=None,
    meta=_event_meta("bed_demographic", "bed"),
)
class TrackedBedDemographic(Bed.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.funder.add"),
    pghistory.DeleteEvent("bed.funder.remove"),
    obj_field=None,
    meta=_event_meta("bed_funder", "bed"),
)
class TrackedBedFunder(Bed.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.medical_need.add"),
    pghistory.DeleteEvent("bed.medical_need.remove"),
    obj_field=None,
    meta=_event_meta("bed_medical_need", "bed"),
)
class TrackedBedMedicalNeed(Bed.medical_needs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("bed.pet.add"),
    pghistory.DeleteEvent("bed.pet.remove"),
    obj_field=None,
    meta=_event_meta("bed_pet", "bed"),
)
class TrackedBedPet(Bed.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


# ── Room M2M joins (parent-prefixed to avoid colliding with Shelter proxies) ─


@pghistory.track(
    pghistory.InsertEvent("room.accessibility.add"),
    pghistory.DeleteEvent("room.accessibility.remove"),
    obj_field=None,
    meta=_event_meta("room_accessibility", "room"),
)
class TrackedRoomAccessibility(Room.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.demographic.add"),
    pghistory.DeleteEvent("room.demographic.remove"),
    obj_field=None,
    meta=_event_meta("room_demographic", "room"),
)
class TrackedRoomDemographic(Room.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.funder.add"),
    pghistory.DeleteEvent("room.funder.remove"),
    obj_field=None,
    meta=_event_meta("room_funder", "room"),
)
class TrackedRoomFunder(Room.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("room.pet.add"),
    pghistory.DeleteEvent("room.pet.remove"),
    obj_field=None,
    meta=_event_meta("room_pet", "room"),
)
class TrackedRoomPet(Room.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True
