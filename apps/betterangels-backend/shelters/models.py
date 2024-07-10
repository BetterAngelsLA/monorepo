from common.models import Attachment, BaseModel
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.gis.db.models import PointField
from django.db import models
from django_choices_field import TextChoicesField
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField

from .enums import (
    AccessibilityEnum,
    CareerServiceEnum,
    EntryRequirementEnum,
    FunderEnum,
    GeneralServiceEnum,
    HealthServiceEnum,
    ImmediateNeedEnum,
    ParkingEnum,
    PopulationEnum,
    ShelterTypeEnum,
    StorageEnum,
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
    name = TextChoicesField(choices_enum=ShelterTypeEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Population(models.Model):
    name = TextChoicesField(choices_enum=PopulationEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ImmediateNeed(models.Model):
    name = TextChoicesField(choices_enum=ImmediateNeedEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class GeneralService(models.Model):
    name = TextChoicesField(choices_enum=GeneralServiceEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class HealthService(models.Model):
    name = TextChoicesField(choices_enum=HealthServiceEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class CareerService(models.Model):
    name = TextChoicesField(choices_enum=CareerServiceEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Funder(models.Model):
    name = TextChoicesField(choices_enum=FunderEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Accessibility(models.Model):
    name = TextChoicesField(choices_enum=AccessibilityEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Storage(models.Model):
    name = TextChoicesField(choices_enum=StorageEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Parking(models.Model):
    name = TextChoicesField(choices_enum=ParkingEnum, db_index=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Restrictions
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementEnum, db_index=True, blank=True, null=True)

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
    description = models.TextField(blank=True, null=True)
    intake_process = models.TextField(blank=True, null=True)

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

    # Service Information

    # Bed Information
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    available_beds = models.PositiveIntegerField(blank=True, null=True)
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    bed_layout_description = models.TextField(blank=True, null=True)

    # Restrictions and Requirements
    spa = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="SPA")

    # Visuals
    hero_image = models.OneToOneField(
        Attachment, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_image_shelter"
    )
    attachments = GenericRelation(
        Attachment,
    )

    def __str__(self) -> str:
        return self.title
