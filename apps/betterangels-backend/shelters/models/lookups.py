"""Enum-backed M2M lookup models.

Small single-field models used as targets for Shelter's ManyToManyFields.
Each wraps a TextChoicesField / IntegerChoicesField with ``unique=True``.
"""

from common.models import BaseModel
from django.db import models
from django.db.models import UniqueConstraint
from django.db.models.functions import Lower
from django_choices_field import IntegerChoicesField, TextChoicesField
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StorageChoices,
    VaccinationRequirementChoices,
)


# Summary Info
class Demographic(models.Model):
    name = TextChoicesField(choices_enum=DemographicChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class SpecialSituationRestriction(models.Model):
    name = TextChoicesField(choices_enum=SpecialSituationRestrictionChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ShelterType(models.Model):
    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Details
class RoomStyle(models.Model):
    name = TextChoicesField(choices_enum=RoomStyleChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Shelter Details
class Accessibility(models.Model):
    name = TextChoicesField(choices_enum=AccessibilityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Storage(models.Model):
    name = TextChoicesField(choices_enum=StorageChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Pet(models.Model):
    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Parking(models.Model):
    name = TextChoicesField(choices_enum=ParkingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Entry Requirements
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class VaccinationRequirement(models.Model):
    name = TextChoicesField(choices_enum=VaccinationRequirementChoices, unique=True)

    def __str__(self) -> str:
        return str(self.name)


# Ecosystem Information
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


class SPA(models.Model):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return str(self.name)


class ShelterProgram(models.Model):
    name = TextChoicesField(choices_enum=ShelterProgramChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Funder(models.Model):
    name = TextChoicesField(choices_enum=FunderChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ExitPolicy(models.Model):
    name = TextChoicesField(choices_enum=ExitPolicyChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ReferralRequirement(models.Model):
    name = TextChoicesField(choices_enum=ReferralRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)
