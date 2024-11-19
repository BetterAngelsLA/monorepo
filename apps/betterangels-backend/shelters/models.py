from typing import Any, Dict, Optional

import pghistory
from admin_async_upload.models import AsyncFileField
from common.history import RevertibleTrackedModel
from common.models import BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField
from places.fields import PlacesField
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    CITY_COUNCIL_DISTRICT_CHOICES,
    SUPERVISORIAL_DISTRICT_CHOICES,
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
    TrainingServiceChoices,
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


# Services Offered
class ImmediateNeed(models.Model):
    name = TextChoicesField(choices_enum=ImmediateNeedChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class GeneralService(models.Model):
    name = TextChoicesField(choices_enum=GeneralServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class HealthService(models.Model):
    name = TextChoicesField(choices_enum=HealthServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class TrainingService(models.Model):
    name = TextChoicesField(choices_enum=TrainingServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Entry Requirements
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Ecosystem Information
class City(models.Model):
    name = TextChoicesField(choices_enum=CityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class SPA(models.Model):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)

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


@pghistory.track(
    pghistory.InsertEvent("shelter.add"),
    pghistory.UpdateEvent("shelter.update"),
    pghistory.DeleteEvent("shelter.remove"),
)
class Shelter(BaseModel):
    # Basic Information
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, blank=True, null=True)
    location = PlacesField(blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = PhoneNumberField()
    website = models.URLField(blank=True, null=True)

    # Summary Information
    description = CKEditor5Field()
    demographics = models.ManyToManyField(Demographic)
    demographics_other = models.CharField(max_length=255, blank=True, null=True)
    special_situation_restrictions = models.ManyToManyField(SpecialSituationRestriction)
    shelter_types = models.ManyToManyField(ShelterType)
    shelter_types_other = models.CharField(max_length=255, blank=True, null=True)

    # Sleeping Details
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    room_styles = models.ManyToManyField(RoomStyle)
    room_styles_other = models.CharField(max_length=255, blank=True, null=True)

    # Shelter Details
    accessibility = models.ManyToManyField(Accessibility)
    storage = models.ManyToManyField(Storage)
    pets = models.ManyToManyField(Pet)
    parking = models.ManyToManyField(Parking)

    # Restrictions
    max_stay = models.PositiveIntegerField(blank=True, null=True, verbose_name="Max Stay (days)")
    curfew = models.TimeField(null=True, blank=True)
    on_site_security = models.BooleanField(null=True, blank=True)
    other_rules = CKEditor5Field(null=True, blank=True)

    # Services Offered
    immediate_needs = models.ManyToManyField(ImmediateNeed)
    general_services = models.ManyToManyField(GeneralService)
    health_services = models.ManyToManyField(HealthService)
    training_services = models.ManyToManyField(TrainingService)
    other_services = CKEditor5Field(null=True, blank=True)

    # Entry Requirements
    entry_info = CKEditor5Field(null=True, blank=True)
    entry_requirements = models.ManyToManyField(EntryRequirement)
    bed_fees = CKEditor5Field(null=True, blank=True)
    program_fees = CKEditor5Field(null=True, blank=True)

    # Ecosystem Information
    cities = models.ManyToManyField(City)
    spa = models.ManyToManyField(SPA)
    city_council_district = models.PositiveSmallIntegerField(
        choices=CITY_COUNCIL_DISTRICT_CHOICES,
        null=True,
        blank=True,
        verbose_name="LA City Council District",
        db_index=True,
    )
    supervisorial_district = models.PositiveSmallIntegerField(
        choices=SUPERVISORIAL_DISTRICT_CHOICES,
        null=True,
        blank=True,
        verbose_name="Supervisorial District",
        db_index=True,
    )
    shelter_programs = models.ManyToManyField(ShelterProgram)
    shelter_programs_other = models.CharField(max_length=255, blank=True, null=True)
    funders = models.ManyToManyField(Funder)
    funders_other = models.CharField(max_length=255, blank=True, null=True)

    # Better Angels Review
    overall_rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], null=True, blank=True)
    subjective_review = CKEditor5Field(null=True, blank=True)

    # Better Angels Admin
    status = TextChoicesField(choices_enum=StatusChoices, default=StatusChoices.DRAFT)

    def revert_action(self, action: str, diff: Dict[str, Any], *args: Any, **kwargs: Any) -> None:
        match action:
            case "update":
                for field, changes in diff.items():
                    setattr(self, field, changes[0])

                self.save()
            case _:
                raise Exception(f"Action {action} is not revertable")

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name


def upload_path(instance: Optional[Shelter], filename: str) -> str:
    """
    Generate a flat upload path for all files.
    """
    return f"shelters/{filename}"


class ContactInfo(models.Model):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="additional_contacts")
    contact_name = models.CharField(max_length=255, verbose_name="Contact Name")
    contact_number = PhoneNumberField(verbose_name="Contact Number")

    def __str__(self) -> str:
        return f"{self.contact_name} - {self.contact_number}"


class InteriorPhoto(models.Model):
    file = AsyncFileField(upload_to=upload_path)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="interior_photos")


class ExteriorPhoto(models.Model):
    file = AsyncFileField(upload_to=upload_path)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="exterior_photos")


class Video(models.Model):
    file = AsyncFileField(upload_to=upload_path)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="videos")


# Proxy models for tracking ManyToManyField through tables
@pghistory.track(
    pghistory.InsertEvent("shelter.demographic.add"),
    pghistory.DeleteEvent("shelter.demographic.remove"),
    obj_field=None,
)
class TrackedDemographic(Shelter.demographics.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.special_restriction.add"),
    pghistory.DeleteEvent("shelter.special_restriction.remove"),
    obj_field=None,
)
class TrackedSpecialSituationRestriction(Shelter.special_situation_restrictions.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_type.add"),
    pghistory.DeleteEvent("shelter.shelter_type.remove"),
    obj_field=None,
)
class TrackedShelterType(Shelter.shelter_types.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.room_style.add"),
    pghistory.DeleteEvent("shelter.room_style.remove"),
    obj_field=None,
)
class TrackedRoomStyle(Shelter.room_styles.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.accessibility.add"),
    pghistory.DeleteEvent("shelter.accessibility.remove"),
    obj_field=None,
)
class TrackedAccessibility(Shelter.accessibility.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.storage.add"),
    pghistory.DeleteEvent("shelter.storage.remove"),
    obj_field=None,
)
class TrackedStorage(Shelter.storage.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.pet.add"),
    pghistory.DeleteEvent("shelter.pet.remove"),
    obj_field=None,
)
class TrackedPet(Shelter.pets.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.parking.add"),
    pghistory.DeleteEvent("shelter.parking.remove"),
    obj_field=None,
)
class TrackedParking(Shelter.parking.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.immediate_need.add"),
    pghistory.DeleteEvent("shelter.immediate_need.remove"),
    obj_field=None,
)
class TrackedImmediateNeed(Shelter.immediate_needs.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.general_service.add"),
    pghistory.DeleteEvent("shelter.general_service.remove"),
    obj_field=None,
)
class TrackedGeneralService(Shelter.general_services.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.health_service.add"),
    pghistory.DeleteEvent("shelter.health_service.remove"),
    obj_field=None,
)
class TrackedHealthService(Shelter.health_services.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.training_service.add"),
    pghistory.DeleteEvent("shelter.training_service.remove"),
    obj_field=None,
)
class TrackedTrainingService(Shelter.training_services.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.entry_requirement.add"),
    pghistory.DeleteEvent("shelter.entry_requirement.remove"),
    obj_field=None,
)
class TrackedEntryRequirement(Shelter.entry_requirements.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.city.add"),
    pghistory.DeleteEvent("shelter.city.remove"),
    obj_field=None,
)
class TrackedCity(Shelter.cities.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.spa.add"),
    pghistory.DeleteEvent("shelter.spa.remove"),
    obj_field=None,
)
class TrackedSPA(Shelter.spa.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_program.add"),
    pghistory.DeleteEvent("shelter.shelter_program.remove"),
    obj_field=None,
)
class TrackedShelterProgram(Shelter.shelter_programs.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.funder.add"),
    pghistory.DeleteEvent("shelter.funder.remove"),
    obj_field=None,
)
class TrackedFunder(Shelter.funders.through, RevertibleTrackedModel):  # type: ignore[name-defined]
    class Meta:
        proxy = True
