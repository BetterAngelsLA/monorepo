"""Enum-backed M2M lookup types.

Using ``auto`` for the ``name`` field: strawberry-django auto-detects
django-choices-field's ``TextChoicesField`` / ``IntegerChoicesField``
and resolves them to the corresponding strawberry enum type.
"""

import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters import models
from strawberry import ID, auto


@strawberry_django.type(models.ContactInfo)
class ContactInfoType:
    id: ID
    contact_name: auto
    contact_number: PhoneNumberScalar  # type: ignore


# Enum-backed M2M lookup types.


@strawberry_django.type(models.Demographic)
class DemographicType:
    name: auto


@strawberry_django.type(models.SpecialSituationRestriction)
class SpecialSituationRestrictionType:
    name: auto


@strawberry_django.type(models.ShelterType)
class ShelterTypeType:
    name: auto


@strawberry_django.type(models.RoomStyle)
class RoomStyleType:
    name: auto


@strawberry_django.type(models.Accessibility)
class AccessibilityType:
    name: auto


@strawberry_django.type(models.Storage)
class StorageType:
    name: auto


@strawberry_django.type(models.Pet)
class PetType:
    name: auto


@strawberry_django.type(models.Parking)
class ParkingType:
    name: auto


@strawberry_django.type(models.ImmediateNeed)
class ImmediateNeedType:
    name: auto


@strawberry_django.type(models.GeneralService)
class GeneralServiceType:
    name: auto


@strawberry_django.type(models.HealthService)
class HealthServiceType:
    name: auto


@strawberry_django.type(models.TrainingService)
class TrainingServiceType:
    name: auto


@strawberry_django.type(models.EntryRequirement)
class EntryRequirementType:
    name: auto


@strawberry_django.type(models.City)
class CityType:
    id: auto
    name: auto


@strawberry_django.type(models.SPA)
class SPAType:
    name: auto


@strawberry_django.type(models.ShelterProgram)
class ShelterProgramType:
    name: auto


@strawberry_django.type(models.Funder)
class FunderType:
    name: auto
