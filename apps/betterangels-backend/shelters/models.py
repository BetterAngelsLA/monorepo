from django.db import models
from django.contrib.gis.db.models import PointField
from .enums import (
    ServiceEnum,
    PopulationEnum,
    RequirementEnum,
    HowToEnterEnum,
    BedStateEnum,
)


# Base Classes
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:  # Prevent a naming conflict
        abstract = True


# Models with enumerated types
class Service(models.Model):
    title = models.CharField(choices=[(x, x.value) for x in ServiceEnum], unique=True)


class Population(models.Model):
    title = models.CharField(choices=[(x, x.value) for x in PopulationEnum],
                             unique=True)


class Requirement(models.Model):
    title = models.CharField(choices=[(x, x.value) for x in RequirementEnum],
                             unique=True)


# I think we can use the enum directly in the Shelter
# class HowToEnter(models.Model):
#     title = models.CharField(choices=[(x, x.value) for x in HowToEnterEnum],
#                              unique=True)


# Primary Models
class Location(TimeStampedModel):
    point = PointField()
    spa = models.PositiveSmallIntegerField()
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    zip_code = models.PositiveSmallIntegerField()
    confidential = models.BooleanField()


class CatchmentZone(TimeStampedModel):
    # TODO -- create a polygon object
    pass


class Shelter(TimeStampedModel):
    title = models.CharField(max_length=255)
    image_url = models.URLField()
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)
    services = models.ManyToManyField(Service)
    population = models.ManyToManyField(Population)
    requirements = models.ManyToManyField(Requirement)
    how_to_enter = models.CharField(choices=[(x, x.value) for x in HowToEnterEnum])

    max_stay = models.PositiveSmallIntegerField()
    average_bed_rate = models.DecimalField(max_digits=10, decimal_places=2)

    # Contact Information
    email = models.EmailField(max_length=254)
    phone = models.CharField(max_length=20)
    website = models.URLField()

    # Description
    description = models.TextField()
    bed_layout_description = models.TextField()
    typical_stay_description = models.TextField()

    # TODO -- handle notes


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
