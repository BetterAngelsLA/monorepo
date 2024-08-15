import pghistory
from common.models import Address, Attachment, BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericRelation
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    AccessibilityChoices,
    CareerServiceChoices,
    CityChoices,
    EntryRequirementChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    ParkingChoices,
    PetChoices,
    PopulationChoices,
    ShelterChoices,
    SleepingChoices,
    SPAChoices,
    StorageChoices,
)


# Advanced Info
@pghistory.track(pghistory.InsertEvent("shelter_type.add"), pghistory.DeleteEvent("shelter_type.remove"))
class ShelterType(models.Model):
    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("population.add"), pghistory.DeleteEvent("population.remove"))
class Population(models.Model):
    name = TextChoicesField(choices_enum=PopulationChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("immediate_need.add"), pghistory.DeleteEvent("immediate_need.remove"))
class ImmediateNeed(models.Model):
    name = TextChoicesField(choices_enum=ImmediateNeedChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("general_service.add"), pghistory.DeleteEvent("general_service.remove"))
class GeneralService(models.Model):
    name = TextChoicesField(choices_enum=GeneralServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("health_service.add"), pghistory.DeleteEvent("health_service.remove"))
class HealthService(models.Model):
    name = TextChoicesField(choices_enum=HealthServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("career_service.add"), pghistory.DeleteEvent("career_service.remove"))
class CareerService(models.Model):
    name = TextChoicesField(choices_enum=CareerServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("funder.add"), pghistory.DeleteEvent("funder.remove"))
class Funder(models.Model):
    name = TextChoicesField(choices_enum=FunderChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("accessibility.add"), pghistory.DeleteEvent("accessibility.remove"))
class Accessibility(models.Model):
    name = TextChoicesField(choices_enum=AccessibilityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("storage.add"), pghistory.DeleteEvent("storage.remove"))
class Storage(models.Model):
    name = TextChoicesField(choices_enum=StorageChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("parking.add"), pghistory.DeleteEvent("parking.remove"))
class Parking(models.Model):
    name = TextChoicesField(choices_enum=ParkingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Restrictions
@pghistory.track(pghistory.InsertEvent("entry_requirement.add"), pghistory.DeleteEvent("entry_requirement.remove"))
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("cities.add"), pghistory.DeleteEvent("cities.remove"))
class City(models.Model):
    name = TextChoicesField(choices_enum=CityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("spa.add"), pghistory.DeleteEvent("spa.remove"))
class SPA(models.Model):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(pghistory.InsertEvent("pet.add"), pghistory.DeleteEvent("pet.remove"))
class Pet(models.Model):
    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Info
@pghistory.track(pghistory.InsertEvent("sleeping_option.add"), pghistory.DeleteEvent("sleeping_option.remove"))
class SleepingOption(models.Model):
    name = TextChoicesField(choices_enum=SleepingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


@pghistory.track(
    pghistory.InsertEvent("shelter.add"),
    pghistory.UpdateEvent("shelter.update"),
    pghistory.DeleteEvent("shelter.remove"),
)
class Shelter(BaseModel):
    # Basic Information
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, blank=True, null=True)
    email = models.EmailField(max_length=254, null=True, blank=True)
    phone = PhoneNumberField()
    website = models.URLField(null=True, blank=True)

    # Other Information
    description = CKEditor5Field(null=True)
    how_to_enter = CKEditor5Field(blank=True, null=True)
    mandatory_worship_attendance = models.BooleanField(null=True, blank=True)

    # Location Fields
    address = models.ForeignKey(Address, on_delete=models.CASCADE, null=True, blank=True, related_name="shelter")

    # Advanced Info
    shelter_types = models.ManyToManyField(ShelterType)
    populations = models.ManyToManyField(Population)
    immediate_needs = models.ManyToManyField(ImmediateNeed)
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
        validators=[MinValueValidator(1), MaxValueValidator(15)],
        null=True,
        blank=True,
        verbose_name="LA City Council District (1-15)",
    )
    supervisorial_district = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True,
        verbose_name="Supervisorial District (1-5)",
    )
    spa = models.ManyToManyField(SPA)
    pets = models.ManyToManyField(Pet)
    curfew = models.TimeField(null=True, blank=True)
    max_stay = models.PositiveIntegerField(blank=True, null=True, verbose_name="Max Stay (days)")
    security = models.BooleanField(null=True, blank=True)
    drugs = models.BooleanField(null=True, blank=True)
    program_fees = models.BooleanField(null=True, blank=True)

    # Bed Information
    fees = CKEditor5Field(blank=True, null=True)
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    sleeping_options = models.ManyToManyField(SleepingOption)

    # Visuals
    attachments = GenericRelation(
        Attachment,
    )

    # Administration
    is_reviewed = models.BooleanField(default=False)

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name
