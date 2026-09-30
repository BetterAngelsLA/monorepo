"""Enum-backed M2M lookup models.

Small single-field models used as targets for Shelter's ManyToManyFields.
Each wraps a TextChoicesField / IntegerChoicesField with ``unique=True``.
"""

import pghistory
from common.models import BaseModel
from common.permissions.utils import PermissionSet
from django.db import models
from django.db.models import UniqueConstraint
from django.db.models.functions import Lower
from django_choices_field import IntegerChoicesField, TextChoicesField
from shelters.enums import SPAChoices
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    MedicalNeedChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SpecialSituationRestrictionChoices,
    StorageChoices,
    VaccinationRequirementChoices,
)


@pghistory.track(
    pghistory.InsertEvent("demographic.add"),
    pghistory.UpdateEvent("demographic.update"),
    pghistory.DeleteEvent("demographic.remove"),
)
class Demographic(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=DemographicChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("special_situation_restriction.add"),
    pghistory.UpdateEvent("special_situation_restriction.update"),
    pghistory.DeleteEvent("special_situation_restriction.remove"),
)
class SpecialSituationRestriction(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=SpecialSituationRestrictionChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("shelter_type.add"),
    pghistory.UpdateEvent("shelter_type.update"),
    pghistory.DeleteEvent("shelter_type.remove"),
)
class ShelterType(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Details
@pghistory.track(
    pghistory.InsertEvent("room_style.add"),
    pghistory.UpdateEvent("room_style.update"),
    pghistory.DeleteEvent("room_style.remove"),
)
class RoomStyle(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=RoomStyleChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Shelter Details
@pghistory.track(
    pghistory.InsertEvent("accessibility.add"),
    pghistory.UpdateEvent("accessibility.update"),
    pghistory.DeleteEvent("accessibility.remove"),
)
class Accessibility(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=AccessibilityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("storage.add"),
    pghistory.UpdateEvent("storage.update"),
    pghistory.DeleteEvent("storage.remove"),
)
class Storage(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=StorageChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("pet.add"),
    pghistory.UpdateEvent("pet.update"),
    pghistory.DeleteEvent("pet.remove"),
)
class Pet(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("parking.add"),
    pghistory.UpdateEvent("parking.update"),
    pghistory.DeleteEvent("parking.remove"),
)
class Parking(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=ParkingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Entry Requirements
@pghistory.track(
    pghistory.InsertEvent("entry_requirement.add"),
    pghistory.UpdateEvent("entry_requirement.update"),
    pghistory.DeleteEvent("entry_requirement.remove"),
)
class EntryRequirement(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("vaccination_requirement.add"),
    pghistory.UpdateEvent("vaccination_requirement.update"),
    pghistory.DeleteEvent("vaccination_requirement.remove"),
)
class VaccinationRequirement(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=VaccinationRequirementChoices, unique=True)

    def __str__(self) -> str:
        return str(self.name)


# Ecosystem Information
@pghistory.track(
    pghistory.InsertEvent("city.add"),
    pghistory.UpdateEvent("city.update"),
    pghistory.DeleteEvent("city.remove"),
)
class City(BaseModel):
    """Cities that shelters serve. Users can add new cities directly."""

    name = models.CharField(max_length=255, unique=True, db_index=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Cities"
        constraints = [
            UniqueConstraint(
                Lower("name"),
                name="city_name_ci_unique",
            ),
        ]

    def __str__(self) -> str:
        return self.name


@pghistory.track(
    pghistory.InsertEvent("spa.add"),
    pghistory.UpdateEvent("spa.update"),
    pghistory.DeleteEvent("spa.remove"),
)
class SPA(BaseModel):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)
    short_name = models.CharField(max_length=10, unique=True, db_index=True)
    long_name = models.CharField(max_length=255, unique=True, db_index=True)

    class Meta:
        ordering = ["short_name"]

    def __str__(self) -> str:
        return self.long_name


@pghistory.track(
    pghistory.InsertEvent("shelter_program.add"),
    pghistory.UpdateEvent("shelter_program.update"),
    pghistory.DeleteEvent("shelter_program.remove"),
)
class ShelterProgram(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=ShelterProgramChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("funder.add"),
    pghistory.UpdateEvent("funder.update"),
    pghistory.DeleteEvent("funder.remove"),
)
class Funder(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=FunderChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("exit_policy.add"),
    pghistory.UpdateEvent("exit_policy.update"),
    pghistory.DeleteEvent("exit_policy.remove"),
)
class ExitPolicy(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=ExitPolicyChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("referral_requirement.add"),
    pghistory.UpdateEvent("referral_requirement.update"),
    pghistory.DeleteEvent("referral_requirement.remove"),
)
class ReferralRequirement(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=ReferralRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("medical_need.add"),
    pghistory.UpdateEvent("medical_need.update"),
    pghistory.DeleteEvent("medical_need.remove"),
)
class MedicalNeed(models.Model):
    class perms(PermissionSet):
        pass

    name = TextChoicesField(choices_enum=MedicalNeedChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)
