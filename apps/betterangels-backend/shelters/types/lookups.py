"""Enum-backed M2M lookup types.

Using ``auto`` for the ``name`` field: strawberry-django auto-detects
django-choices-field's ``TextChoicesField`` / ``IntegerChoicesField``
and resolves them to the corresponding strawberry enum type.
"""

import strawberry_django
from common.graphql.types import PhoneNumberScalar
from shelters import models
from strawberry import ID, Maybe, auto


@strawberry_django.type(models.ContactInfo)
class ContactInfoType:
    id: ID
    contact_name: auto
    contact_number: PhoneNumberScalar  # type: ignore


# Enum-backed M2M lookup types.


@strawberry_django.type(models.Accessibility)
class AccessibilityType:
    name: auto


@strawberry_django.type(models.City)
class CityType:
    id: auto
    name: auto


@strawberry_django.type(models.Demographic)
class DemographicType:
    name: auto


@strawberry_django.type(models.MedicalNeed)
class MedicalNeedType:
    name: auto


@strawberry_django.type(models.EntryRequirement)
class EntryRequirementType:
    name: auto


@strawberry_django.type(models.VaccinationRequirement)
class VaccinationRequirementType:
    name: auto


@strawberry_django.type(models.ExitPolicy)
class ExitPolicyType:
    name: auto


@strawberry_django.type(models.Funder)
class FunderType:
    name: auto


@strawberry_django.type(models.Parking)
class ParkingType:
    name: auto


@strawberry_django.type(models.Pet)
class PetType:
    name: auto


@strawberry_django.type(models.ReferralRequirement)
class ReferralRequirementType:
    name: auto


@strawberry_django.type(models.RoomStyle)
class RoomStyleType:
    name: auto


@strawberry_django.type(models.Schedule)
class ScheduleType:
    id: ID
    schedule_type: auto
    day: auto
    start_time: auto
    end_time: auto
    start_date: auto
    end_date: auto
    condition: auto
    demographic: DemographicType | None
    is_exception: auto


@strawberry_django.type(models.ServiceCategory)
class ServiceCategoryType:
    id: ID
    name: auto
    display_name: auto
    priority: auto
    services: list["ServiceType"]


@strawberry_django.type(models.Service)
class ServiceType:
    id: ID
    category: ServiceCategoryType
    name: auto
    display_name: auto
    is_other: auto
    priority: auto


@strawberry_django.type(models.ShelterProgram)
class ShelterProgramType:
    name: auto


@strawberry_django.type(models.ShelterType)
class ShelterTypeType:
    name: auto


@strawberry_django.type(models.SPA)
class SPAType:
    id: ID
    short_name: Maybe[str]

    @strawberry_django.field(only=["long_name"])
    def name(self, root: models.SPA) -> str:
        return root.long_name


@strawberry_django.type(models.SpecialSituationRestriction)
class SpecialSituationRestrictionType:
    name: auto


@strawberry_django.type(models.Storage)
class StorageType:
    name: auto
