from django.db import models
from django_choices_field import TextChoicesField

from common.models import BaseModel

# from django.contrib.gis.db.models import PointField
from .enums import (
    HowToEnterEnum, ServiceEnum, PopulationEnum, RequirementEnum, ShelterTypeEnum
)


# Permissions on Service, Population, and Requirement models
# should be more restrictive than on Shelter
# Service model should include some reference to the icon


# Set default to make gql returns consistent between charfield and textfield
class Shelter(BaseModel):
    title = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)

    # Location Fields - flat for easier creation via admin console
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    spa = models.PositiveSmallIntegerField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=255, blank=True, default='')
    state = models.CharField(max_length=255, blank=True, default='')
    zip_code = models.PositiveIntegerField(blank=True, null=True)
    confidential = models.BooleanField(blank=True, null=True)

    # Contact Information
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, default='')
    website = models.URLField(null=True, blank=True)

    # Description
    description = models.TextField(blank=True, null=True)
    typical_stay_description = models.TextField(blank=True, null=True)

    # Bed Information
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    available_beds = models.PositiveIntegerField(blank=True, null=True)
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    average_bed_rate = models.DecimalField(blank=True, null=True,
                                           max_digits=10, decimal_places=2)
    bed_layout_description = models.TextField(blank=True, null=True)

    # TODO -- handle notes - can notes be shared between apps

    def __str__(self) -> str:
        return self.title


class Population(models.Model):
    title = TextChoicesField(choices_enum=PopulationEnum, blank=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='populations')

    def __str__(self) -> str:
        return str(self.title)


class Requirement(models.Model):
    title = TextChoicesField(choices_enum=RequirementEnum, blank=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='requirements')

    def __str__(self) -> str:
        return str(self.title)


class ShelterType(models.Model):
    title = TextChoicesField(choices_enum=ShelterTypeEnum, blank=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='shelter_type')

    def __str__(self) -> str:
        return str(self.title)


class Service(models.Model):
    title = TextChoicesField(choices_enum=ServiceEnum, blank=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='services')

    def __str__(self) -> str:
        return str(self.title)


class HowToEnter(models.Model):
    title = TextChoicesField(choices_enum=HowToEnterEnum, blank=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='how_to_enter')

