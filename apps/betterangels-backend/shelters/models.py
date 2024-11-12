import pghistory
from common.models import Address, BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField
from shelters.permissions import ShelterFieldPermissions

from .enums import (
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


@pghistory.track()
class Shelter(BaseModel):
    # Basic Information
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, blank=True, null=True)
    address = models.ForeignKey(Address, on_delete=models.CASCADE, null=True, blank=True, related_name="shelter")
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = PhoneNumberField()
    website = models.URLField(null=True, blank=True)

    # Summary Information
    description = CKEditor5Field(null=True)
    demographics = models.ManyToManyField(Demographic)
    special_situation_restrictions = models.ManyToManyField(SpecialSituationRestriction)
    shelter_types = models.ManyToManyField(ShelterType)

    # Sleeping Details
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    room_styles = models.ManyToManyField(RoomStyle)

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
    bed_fees = models.TextField(null=True, blank=True)
    program_fees = models.TextField(null=True, blank=True)

    # Ecosystem Information
    cities = models.ManyToManyField(City)
    spa = models.ManyToManyField(SPA)
    city_council_district = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 16)],
        null=True,
        blank=True,
        verbose_name="LA City Council District",
    )
    supervisorial_district = models.PositiveSmallIntegerField(
        choices=[(i, str(i)) for i in range(1, 6)],
        null=True,
        blank=True,
        verbose_name="Supervisorial District",
    )
    shelter_programs = models.ManyToManyField(ShelterProgram)
    funders = models.ManyToManyField(Funder)

    # Better Angels Review
    overall_rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], null=True, blank=True)
    subjective_review = CKEditor5Field(null=True, blank=True)

    # Better Angels Admin
    status = TextChoicesField(choices_enum=StatusChoices, default=StatusChoices.DRAFT)

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name
