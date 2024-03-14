from django.db import models
from django_choices_field import TextChoicesField

# from django.contrib.gis.db.models import PointField
from .enums import (
    ServiceEnum,
    PopulationEnum,
    RequirementEnum,
    HowToEnterEnum,
    BedStateEnum,
    ShelterTypeEnum
)


# Base Classes
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:  # Prevent a naming conflict
        abstract = True


# Models with enumerated types
class Service(models.Model):
    title = TextChoicesField(choices_enum=ServiceEnum)

    def __str__(self) -> str:
        return str(self.title)


class Population(models.Model):
    title = TextChoicesField(choices_enum=PopulationEnum)

    def __str__(self) -> str:
        return str(self.title)


class Requirement(models.Model):
    title = TextChoicesField(choices_enum=RequirementEnum)

    def __str__(self) -> str:
        return str(self.title)


class ShelterType(models.Model):
    title = TextChoicesField(choices_enum=ShelterTypeEnum)

    def __str__(self) -> str:
        return str(self.title)


class Shelter(TimeStampedModel):
    title = models.CharField(max_length=255)
    image_url = models.URLField()

    shelter_type = models.ForeignKey(ShelterType, blank=True, null=True,
                                     on_delete=models.PROTECT)
    services = models.ManyToManyField(Service, blank=True)
    population = models.ManyToManyField(Population, blank=True)
    requirements = models.ManyToManyField(Requirement, blank=True)
    how_to_enter = models.CharField(choices=[(x, x.value) for x in HowToEnterEnum])

    max_stay = models.PositiveSmallIntegerField(null=True, blank=True)
    average_bed_rate = models.DecimalField(max_digits=10, decimal_places=2,
                                           null=True, blank=True)

    # Location Fields - flat for easier creation via admin console
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    spa = models.PositiveSmallIntegerField(blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    state = models.CharField(max_length=255, blank=True, null=True)
    zip_code = models.PositiveIntegerField(blank=True, null=True)
    confidential = models.BooleanField(blank=True, null=True)

    # Contact Information
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    website = models.URLField(null=True, blank=True)

    # Description
    description = models.TextField(null=True, blank=True)
    bed_layout_description = models.TextField(null=True, blank=True)
    typical_stay_description = models.TextField(null=True, blank=True)

    # Bed Information
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    private_beds = models.PositiveIntegerField(blank=True, null=True)
    max_day = models.PositiveIntegerField(blank=True, null=True)
    average_bed_rate = models.DecimalField(blank=True, null=True,
                                           max_digits=10, decimal_places=2)


    # TODO -- handle notes

    def __str__(self) -> str:
        return self.title
