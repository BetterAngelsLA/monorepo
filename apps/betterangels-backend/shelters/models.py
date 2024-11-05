from typing import Any

import pghistory
from common.models import Address, BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
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
class ShelterType(models.Model):
    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Population(models.Model):
    name = TextChoicesField(choices_enum=PopulationChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ImmediateNeed(models.Model):
    name = TextChoicesField(choices_enum=ImmediateNeedChoices, unique=True, blank=True, null=True)

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


class SPA(models.Model):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Pet(models.Model):
    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Info
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

    # Administration
    is_reviewed = models.BooleanField(default=False)

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name


# proxy objects to track history on through models


@pghistory.track(
    pghistory.InsertEvent("shelter_shelter_types.add"),
    pghistory.DeleteEvent("shelter_shelter_types.remove"),
    obj_field=None,
)
class ShelterShelterTypes(Shelter.shelter_types.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, shelter_type_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        shelter_type = ShelterType.objects.get(id=shelter_type_id)

        if action == "add":
            shelter.shelter_types.remove(shelter_type)

        elif action == "remove":
            shelter.shelter_types.add(shelter_type)


@pghistory.track(
    pghistory.InsertEvent("shelter_populations.add"),
    pghistory.DeleteEvent("shelter_populations.remove"),
    obj_field=None,
)
class ShelterPopulations(Shelter.populations.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, population_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        population = Population.objects.get(id=population_id)

        if action == "add":
            shelter.populations.remove(population)

        elif action == "remove":
            shelter.populations.add(population)


@pghistory.track(
    pghistory.InsertEvent("shelter_immediate_needs.add"),
    pghistory.DeleteEvent("shelter_immediate_needs.remove"),
    obj_field=None,
)
class ShelterImmediateNeeds(Shelter.immediate_needs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, immediate_need_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        immediate_need = ImmediateNeed.objects.get(id=immediate_need_id)

        if action == "add":
            shelter.immediate_needs.remove(immediate_need)

        elif action == "remove":
            shelter.immediate_needs.add(immediate_need)


@pghistory.track(
    pghistory.InsertEvent("shelter_general_services.add"),
    pghistory.DeleteEvent("shelter_general_services.remove"),
    obj_field=None,
)
class ShelterGeneralServices(Shelter.general_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, general_service_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        general_service = GeneralService.objects.get(id=general_service_id)

        if action == "add":
            shelter.general_services.remove(general_service)

        elif action == "remove":
            shelter.general_services.add(general_service)


@pghistory.track(
    pghistory.InsertEvent("shelter_health_services.add"),
    pghistory.DeleteEvent("shelter_health_services.remove"),
    obj_field=None,
)
class ShelterHealthServices(Shelter.health_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, health_service_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        health_service = HealthService.objects.get(id=health_service_id)

        if action == "add":
            shelter.health_services.remove(health_service)

        elif action == "remove":
            shelter.health_services.add(health_service)


@pghistory.track(
    pghistory.InsertEvent("shelter_career_services.add"),
    pghistory.DeleteEvent("shelter_career_services.remove"),
    obj_field=None,
)
class ShelterCareerServices(Shelter.career_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, career_service_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        career_service = CareerService.objects.get(id=career_service_id)

        if action == "add":
            shelter.career_services.remove(career_service)

        elif action == "remove":
            shelter.career_services.add(career_service)


@pghistory.track(
    pghistory.InsertEvent("shelter_funders.add"),
    pghistory.DeleteEvent("shelter_funders.remove"),
    obj_field=None,
)
class ShelterFunders(Shelter.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, funder_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        funder = Funder.objects.get(id=funder_id)

        if action == "add":
            shelter.funders.remove(funder)

        elif action == "remove":
            shelter.funders.add(funder)


@pghistory.track(
    pghistory.InsertEvent("shelter_accessibility.add"),
    pghistory.DeleteEvent("shelter_accessibility.remove"),
    obj_field=None,
)
class ShelterAccessibility(Shelter.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, accessibility_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        accessibility = Accessibility.objects.get(id=accessibility_id)

        if action == "add":
            shelter.accessibility.remove(accessibility)

        elif action == "remove":
            shelter.accessibility.add(accessibility)


@pghistory.track(
    pghistory.InsertEvent("shelter_storage.add"),
    pghistory.DeleteEvent("shelter_storage.remove"),
    obj_field=None,
)
class ShelterStorage(Shelter.storage.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, storage_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        storage = Storage.objects.get(id=storage_id)

        if action == "add":
            shelter.storage.remove(storage)

        elif action == "remove":
            shelter.storage.add(storage)


@pghistory.track(
    pghistory.InsertEvent("shelter_parking.add"),
    pghistory.DeleteEvent("shelter_parking.remove"),
    obj_field=None,
)
class ShelterParking(Shelter.parking.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, parking_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        parking = Parking.objects.get(id=parking_id)

        if action == "add":
            shelter.parking.remove(parking)

        elif action == "remove":
            shelter.parking.add(parking)


@pghistory.track(
    pghistory.InsertEvent("shelter_entry_requirements.add"),
    pghistory.DeleteEvent("shelter_entry_requirements.remove"),
    obj_field=None,
)
class ShelterEntryRequirements(Shelter.entry_requirements.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, entry_requirement_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        entry_requirement = EntryRequirement.objects.get(id=entry_requirement_id)

        if action == "add":
            shelter.entry_requirements.remove(entry_requirement)

        elif action == "remove":
            shelter.entry_requirements.add(entry_requirement)


@pghistory.track(
    pghistory.InsertEvent("shelter_cities.add"),
    pghistory.DeleteEvent("shelter_cities.remove"),
    obj_field=None,
)
class ShelterCities(Shelter.cities.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, city_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        city = City.objects.get(id=city_id)

        if action == "add":
            shelter.cities.remove(city)

        elif action == "remove":
            shelter.cities.add(city)


@pghistory.track(
    pghistory.InsertEvent("shelter_spa.add"),
    pghistory.DeleteEvent("shelter_spa.remove"),
    obj_field=None,
)
class ShelterSPA(Shelter.spa.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, spa_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        spa = SPA.objects.get(id=spa_id)

        if action == "add":
            shelter.spa.remove(spa)

        elif action == "remove":
            shelter.spa.add(spa)


@pghistory.track(
    pghistory.InsertEvent("shelter_pets.add"),
    pghistory.DeleteEvent("shelter_pets.remove"),
    obj_field=None,
)
class ShelterPets(Shelter.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, pet_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        pet = Pet.objects.get(id=pet_id)

        if action == "add":
            shelter.pets.remove(pet)

        elif action == "remove":
            shelter.pets.add(pet)


@pghistory.track(
    pghistory.InsertEvent("shelter_sleeping_options.add"),
    pghistory.DeleteEvent("shelter_sleeping_options.remove"),
    obj_field=None,
)
class ShelterSleepingOptions(Shelter.sleeping_options.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True

    @staticmethod
    def revert_action(action: str, shelter_id: int, sleeping_option_id: int, *args: Any, **kwargs: Any) -> None:
        shelter = Shelter.objects.get(id=shelter_id)
        sleeping_option = SleepingOption.objects.get(id=sleeping_option_id)

        if action == "add":
            shelter.sleeping_options.remove(sleeping_option)

        elif action == "remove":
            shelter.sleeping_options.add(sleeping_option)
