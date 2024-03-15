from django.db import models

# from django.contrib.gis.db.models import PointField
from .enums import (
    HowToEnterEnum,
)


# Base Classes
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:  # Prevent a naming conflict
        abstract = True


# Permissions on Service, Population, and Requirement models
# should be more restrictive than on Shelter
# Service model should include some reference to the icon
class Service(models.Model):
    title = models.CharField(max_length=64)

    def __str__(self) -> str:
        return str(self.title)


class Population(models.Model):
    title = models.CharField(max_length=64)

    def __str__(self) -> str:
        return str(self.title)


class Requirement(models.Model):
    title = models.CharField(max_length=64)

    def __str__(self) -> str:
        return str(self.title)


class ShelterType(models.Model):
    title = models.CharField(max_length=64)

    def __str__(self) -> str:
        return str(self.title)


# Set default to make gql returns consistent between charfield and textfield
class Shelter(TimeStampedModel):
    title = models.CharField(max_length=255)
    image_url = models.URLField(blank=True, null=True)

    shelter_type = models.ForeignKey(ShelterType, blank=True, null=True,
                                     on_delete=models.PROTECT)
    services = models.ManyToManyField(Service, blank=True)
    population = models.ManyToManyField(Population, blank=True)
    requirements = models.ManyToManyField(Requirement, blank=True)
    how_to_enter = models.CharField(choices=[(x, x.value) for x in HowToEnterEnum],
                                    blank=True, default='')

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
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True)
    average_bed_rate = models.DecimalField(blank=True, null=True,
                                           max_digits=10, decimal_places=2)
    bed_layout_description = models.TextField(blank=True, null=True)

    # TODO -- handle notes

    def __str__(self) -> str:
        return self.title
