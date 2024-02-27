from django.db import models

# from django.contrib.gis.db.models import PointField
from .enums import (
    ServiceEnum,
    PopulationEnum,
    RequirementEnum,
    HowToEnterEnum,
    BedStateEnum,
)

from django_choices_field import TextChoicesField


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
        return self.title


class Population(models.Model):
    title = TextChoicesField(choices_enum=PopulationEnum)

    def __str__(self) -> str:
        return self.title


class Requirement(models.Model):
    title = TextChoicesField(choices_enum=RequirementEnum)

    def __str__(self) -> str:
        return self.title


# Primary Models
class Location(TimeStampedModel):
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)

    spa = models.PositiveSmallIntegerField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    zip_code = models.PositiveIntegerField()
    confidential = models.BooleanField()

    # TODO -- get this working
    # coordinates = PointField()

    def __str__(self) -> str:
        return self.address


class Shelter(TimeStampedModel):
    title = models.CharField(max_length=255)
    image_url = models.URLField()
    location = models.ForeignKey(Location, on_delete=models.CASCADE,
                                 blank=True, null=True, related_name='shelters')
    services = models.ManyToManyField(Service, blank=True)
    population = models.ManyToManyField(Population, blank=True)
    requirements = models.ManyToManyField(Requirement, blank=True)
    how_to_enter = models.CharField(choices=[(x, x.value) for x in HowToEnterEnum])

    max_stay = models.PositiveSmallIntegerField(null=True, blank=True)
    average_bed_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Contact Information
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    website = models.URLField(null=True, blank=True)

    # Description
    description = models.TextField(null=True, blank=True)
    bed_layout_description = models.TextField(null=True, blank=True)
    typical_stay_description = models.TextField(null=True, blank=True)

    # TODO -- handle notes

    def __str__(self) -> str:
        return self.title


# Future Classes
class CatchmentZone(TimeStampedModel):
    # TODO -- create a polygon object
    pass


class Program(TimeStampedModel):
    title = models.CharField(max_length=255)
    requirements = models.ManyToManyField(Requirement)
    catchment_zones = models.ManyToManyField(CatchmentZone)


class Room(TimeStampedModel):
    # How are rooms identified?
    title = models.CharField(max_length=255, blank=True, null=True)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="rooms")
    temporary = models.BooleanField(default=False)
    population = models.ManyToManyField(Population)
    private = models.BooleanField()


class Bed(TimeStampedModel):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="beds")
    state = models.CharField(choices=[(x, x.value) for x in BedStateEnum])
    # TODO - keep?
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='beds')
    # Do we want to know which program this bed is currently associated with?
    # When a bed has a person using it, it may cause the pop. of the room to change
    # The room has a population field, but does the bed need something similar?
    # TODO -- all bed characteristics (ie bunk bed)


class ProgramBedAllocation(TimeStampedModel):
    """Used to show which beds are allocated to a program in a specific shelter."""

    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE,
                                related_name='allocations')
    program = models.ForeignKey(Program, on_delete=models.CASCADE,
                                related_name='allocations')
    beds_allocated = models.PositiveSmallIntegerField(default=0)
    remaining_beds = models.PositiveSmallIntegerField(default=0)
    # My current thought is that we don't need to reference specific beds here, as
    # it shouldn't make a difference to the allocation
