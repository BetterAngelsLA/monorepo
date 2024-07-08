from common.enums import AttachmentType
from common.models import Attachment, BaseModel
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.gis.db.models import PointField
from django.db import models
from django.forms import ValidationError
from django_choices_field import TextChoicesField
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField

from .enums import (
    EntryRequirements,
    FunderEnum,
    PetsAllowedEnum,
    PopulationEnum,
    ServiceEnum,
    ShelterTypeEnum,
)


class Location(BaseModel):
    point = PointField(blank=True, null=True, geography=True)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self) -> str:
        return self.address


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
    spa = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="SPA")

    # Service Information

    # Bed Information
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    available_beds = models.PositiveIntegerField(blank=True, null=True)
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    bed_layout_description = models.TextField(blank=True, null=True)

    # Restrictions and Requirements

    # Visuals
    hero_image = models.OneToOneField(
        Attachment, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_image_shelter"
    )
    attachments = GenericRelation(
        Attachment,
    )

    def __str__(self) -> str:
        return self.title


class PetsAllowed(models.Model):
    title = TextChoicesField(choices_enum=PetsAllowedEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="pets_allowed")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)


class Population(models.Model):
    title = TextChoicesField(choices_enum=PopulationEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="populations")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)


class EntryRequirement(models.Model):
    title = TextChoicesField(choices_enum=EntryRequirements)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="requirements")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)


class ShelterType(models.Model):
    title = TextChoicesField(choices_enum=ShelterTypeEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="shelter_type")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)


class Service(models.Model):
    title = TextChoicesField(choices_enum=ServiceEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="services")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)


class Funder(models.Model):
    title = TextChoicesField(choices_enum=FunderEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="funders")

    class Meta:
        unique_together = ("title", "shelter")

    def __str__(self) -> str:
        return str(self.title)
