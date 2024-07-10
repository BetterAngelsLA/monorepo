from common.models import Attachment, BaseModel
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.gis.db.models import PointField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django_choices_field import TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField

from .enums import (
    AccessibilityChoices,
    CareerServiceChoices,
    CityChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChocies,
    ParkingChoices,
    PetChoices,
    PopulationChoices,
    ShelterChoices,
    SleepingChocies,
    StorageChoices,
)


class Location(BaseModel):
    point = PointField(blank=True, null=True, geography=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self) -> str:
        return self.address


# Advanced Info
class ShelterType(models.Model):
    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Population(models.Model):
    name = TextChoicesField(choices_enum=PopulationChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ImmediateNeed(models.Model):
    name = TextChoicesField(choices_enum=ImmediateNeedChocies, unique=True, blank=True, null=True)

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


class CareerService(models.Model):
    name = TextChoicesField(choices_enum=CareerServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Funder(models.Model):
    name = TextChoicesField(choices_enum=FunderChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Accessibility(models.Model):
    name = TextChoicesField(choices_enum=AccessibilityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Storage(models.Model):
    name = TextChoicesField(choices_enum=StorageChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Parking(models.Model):
    name = TextChoicesField(choices_enum=ParkingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Restrictions
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class City(models.Model):
    name = TextChoicesField(choices_enum=CityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Pet(models.Model):
    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Info
class SleepingOption(models.Model):
    name = TextChoicesField(choices_enum=SleepingChocies, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Shelter(BaseModel):
    # Basic Information
    title = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, blank=True, null=True)
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = PhoneNumberField()
    website = models.URLField(null=True, blank=True)

    # Other Information
    description = CKEditor5Field(blank=True, null=True)
    how_to_enter = CKEditor5Field(blank=True, null=True)
    mandatory_worship_attendance = models.BooleanField(null=True, blank=True)

    # Location Fields
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="shelter")
    confidential = models.BooleanField(blank=True, null=True)

    # Advanced Info
    shelter_types = models.ManyToManyField(ShelterType)
    populations = models.ManyToManyField(Population)
    imeediate_needs = models.ManyToManyField(ImmediateNeed)
    general_services = models.ManyToManyField(GeneralService)
    health_services = models.ManyToManyField(HealthService)
    career_services = models.ManyToManyField(CareerService)
    funders = models.ManyToManyField(Funder)
    accessibility = models.ManyToManyField(Accessibility)
    storage = models.ManyToManyField(Storage)
    parking = models.ManyToManyField(Parking)

    # Restrictions
    entry_requirements = models.ManyToManyField(EntryRequirement)
    cities = models.ManyToManyField(City)
    city_district = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(15)], null=True, blank=True
    )
    supervisorial_district = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True
    )
    spa = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(8)], null=True, blank=True
    )
    pets = models.ManyToManyField(Pet)
    curfew = models.TimeField(null=True, blank=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    drugs = models.BooleanField(null=True, blank=True)
    program_fees = models.BooleanField(null=True, blank=True)

    # Bed Information
    fees = CKEditor5Field(blank=True, null=True)
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    sleeping_options = models.ManyToManyField(SleepingOption)

    # Visuals
    hero_image = models.OneToOneField(
        Attachment, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_image_shelter"
    )
    attachments = GenericRelation(
        Attachment,
    )

    def __str__(self) -> str:
        return self.title
