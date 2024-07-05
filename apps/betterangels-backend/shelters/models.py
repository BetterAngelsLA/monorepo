from common.enums import AttachmentType
from common.models import Attachment, BaseModel
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.gis.db.models import PointField
from django.db import models
from django_choices_field import TextChoicesField
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField

from .enums import (
    FunderEnum,
    HowToEnterEnum,
    PopulationEnum,
    RequirementEnum,
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

    # Demo Images are Base64 encoded to embed in the data rather than having to fetch
    # an image file from a separate location. Will eventually move to the parent
    # organization once connected to the storage bucket.
    image_url = models.URLField(blank=True, null=True)

    # Location Fields
    location = models.ForeignKey(Location, on_delete=models.CASCADE, null=True, blank=True, related_name="shelter")
    spa = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name="SPA")
    confidential = models.BooleanField(blank=True, null=True)

    # Contact Information

    # Description
    description = models.TextField(blank=True, null=True)
    typical_stay_description = models.TextField(blank=True, null=True)

    # Bed Information
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    available_beds = models.PositiveIntegerField(blank=True, null=True)
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    average_bed_rate = models.DecimalField(blank=True, null=True, max_digits=10, decimal_places=2)
    bed_layout_description = models.TextField(blank=True, null=True)

    # Visuals (Will need to display based off of type)
    # # Will handle photos and videos What about hero image?
    # Could be generic or concreete tables, prefer the generic. but will take concrete if better
    # hero_image = models.OneToOneField(
    #     Attachment, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_image_shelter"
    # )
    # photos = models.ManyToManyField(Attachment, related_name="photo_shelters", blank=True)
    hero_image = models.OneToOneField(
        Attachment, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_image_shelter"
    )
    attachments = GenericRelation(Attachment)

    def __str__(self) -> str:
        return self.title


class Population(models.Model):
    title = TextChoicesField(choices_enum=PopulationEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="populations")

    def __str__(self) -> str:
        return str(self.title)


class Requirement(models.Model):
    title = TextChoicesField(choices_enum=RequirementEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="requirements")

    def __str__(self) -> str:
        return str(self.title)


class ShelterType(models.Model):
    title = TextChoicesField(choices_enum=ShelterTypeEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="shelter_type")

    def __str__(self) -> str:
        return str(self.title)


class Service(models.Model):
    title = TextChoicesField(choices_enum=ServiceEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="services")

    def __str__(self) -> str:
        return str(self.title)


class HowToEnter(models.Model):
    title = TextChoicesField(choices_enum=HowToEnterEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="how_to_enter")

    def __str__(self) -> str:
        return str(self.title)


class Funder(models.Model):
    title = TextChoicesField(choices_enum=FunderEnum)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="funders")

    def __str__(self) -> str:
        return str(self.title)
