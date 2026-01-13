from typing import Any, Optional

import pghistory
from admin_async_upload.models import AsyncFileField
from common.models import BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import Point
from django.core.exceptions import ValidationError
from django.core.files.storage import default_storage
from django.db import models
from django_choices_field import IntegerChoicesField, TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField
from places.fields import PlacesField
from shelters.permissions import ShelterFieldPermissions

from .enums import (
    CITY_COUNCIL_DISTRICT_CHOICES,
    SUPERVISORIAL_DISTRICT_CHOICES,
    AccessibilityChoices,
    CityChoices,
    DemographicChoices,
    EntryRequirementChoices,
    ExitPolicyChoices,
    FunderChoices,
    GeneralServiceChoices,
    HealthServiceChoices,
    ImmediateNeedChoices,
    MealServiceChoices,
    ParkingChoices,
    PetChoices,
    ReferralRequirementChoices,
    RoomStyleChoices,
    ShelterChoices,
    ShelterProgramChoices,
    SPAChoices,
    SpecialSituationRestrictionChoices,
    StatusChoices,
    StorageChoices,
    TrainingServiceChoices,
)
from .widgets import TimeRangeField

# Fields that have corresponding _other text fields for "Please specify..." pattern
# Used by both form validation (admin.py) and model validation (clean method)
# When adding new fields with this pattern, add them to this list
FIELDS_WITH_OTHER_OPTION = [
    "demographics",
    "shelter_types",
    "room_styles",
    "exit_policy",
    "cities",
    "shelter_programs",
    "funders",
]


# Summary Info
class Demographic(models.Model):
    name = TextChoicesField(choices_enum=DemographicChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class SpecialSituationRestriction(models.Model):
    name = TextChoicesField(choices_enum=SpecialSituationRestrictionChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ShelterType(models.Model):
    name = TextChoicesField(choices_enum=ShelterChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Sleeping Details
class RoomStyle(models.Model):
    name = TextChoicesField(choices_enum=RoomStyleChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Shelter Details
class Accessibility(models.Model):
    name = TextChoicesField(choices_enum=AccessibilityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Storage(models.Model):
    name = TextChoicesField(choices_enum=StorageChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Pet(models.Model):
    name = TextChoicesField(choices_enum=PetChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Parking(models.Model):
    name = TextChoicesField(choices_enum=ParkingChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Services Offered
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


class TrainingService(models.Model):
    name = TextChoicesField(choices_enum=TrainingServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Entry Requirements
class EntryRequirement(models.Model):
    name = TextChoicesField(choices_enum=EntryRequirementChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


# Ecosystem Information
class City(models.Model):
    name = TextChoicesField(choices_enum=CityChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class SPA(models.Model):
    name = IntegerChoicesField(choices_enum=SPAChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ShelterProgram(models.Model):
    name = TextChoicesField(choices_enum=ShelterProgramChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class Funder(models.Model):
    name = TextChoicesField(choices_enum=FunderChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ExitPolicy(models.Model):
    name = TextChoicesField(choices_enum=ExitPolicyChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class MealService(models.Model):
    name = TextChoicesField(choices_enum=MealServiceChoices, unique=True, blank=True, null=True)

    def __str__(self) -> str:
        return str(self.name)


class ReferralRequirement(models.Model):
    name = TextChoicesField(choices_enum=ReferralRequirementChoices, unique=True, blank=True, null=True)

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
    location = PlacesField(blank=True, null=True)
    geolocation = PointField(srid=4326, geography=True, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)
    operating_hours = TimeRangeField(null=True, blank=True)

    # Hero Image
    hero_image_content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    hero_image_object_id = models.PositiveIntegerField(null=True, blank=True)
    hero_image = GenericForeignKey("hero_image_content_type", "hero_image_object_id")

    # Summary Information
    description = CKEditor5Field()
    demographics = models.ManyToManyField(Demographic)
    demographics_other = models.CharField(max_length=255, blank=True, null=True)
    special_situation_restrictions = models.ManyToManyField(SpecialSituationRestriction)
    shelter_types = models.ManyToManyField(ShelterType)
    shelter_types_other = models.CharField(max_length=255, blank=True, null=True)

    # Sleeping Details
    total_beds = models.PositiveIntegerField(blank=True, null=True)
    room_styles = models.ManyToManyField(RoomStyle)
    room_styles_other = models.CharField(max_length=255, blank=True, null=True)
    add_notes_sleeping_details = CKEditor5Field(verbose_name="Additional Notes", null=True, blank=True)

    # Shelter Details
    accessibility = models.ManyToManyField(Accessibility)
    storage = models.ManyToManyField(Storage)
    pets = models.ManyToManyField(Pet)
    parking = models.ManyToManyField(Parking)
    add_notes_shelter_details = CKEditor5Field(verbose_name="Additional Notes", null=True, blank=True)

    # Policies
    max_stay = models.PositiveIntegerField(blank=True, null=True, verbose_name="Max Stay (days)")
    intake_hours = TimeRangeField(null=True, blank=True)
    curfew = models.TimeField(null=True, blank=True)
    on_site_security = models.BooleanField(null=True, blank=True)
    visitors_allowed = models.BooleanField(null=True, blank=True)
    exit_policy = models.ManyToManyField(ExitPolicy)
    exit_policy_other = models.CharField(max_length=255, blank=True, null=True)
    emergency_surge = models.BooleanField(verbose_name="Emergency Capacity Surge Options", null=True, blank=True)
    other_rules = CKEditor5Field(null=True, blank=True)

    # Services Offered
    immediate_needs = models.ManyToManyField(ImmediateNeed)
    general_services = models.ManyToManyField(GeneralService)
    health_services = models.ManyToManyField(HealthService)
    training_services = models.ManyToManyField(TrainingService)
    meal_services = models.ManyToManyField(MealService)
    other_services = CKEditor5Field(verbose_name="Additional Notes", null=True, blank=True)

    # Entry Requirements
    entry_info = CKEditor5Field(null=True, blank=True)
    entry_requirements = models.ManyToManyField(EntryRequirement)
    referral_requirement = models.ManyToManyField(ReferralRequirement)
    bed_fees = models.CharField(max_length=255, blank=True, null=True)
    program_fees = models.CharField(max_length=255, blank=True, null=True)

    # Ecosystem Information
    cities = models.ManyToManyField(City)
    cities_other = models.CharField(max_length=255, blank=True, null=True)
    spa = models.ManyToManyField(SPA)
    city_council_district = models.PositiveSmallIntegerField(
        choices=CITY_COUNCIL_DISTRICT_CHOICES,
        null=True,
        blank=True,
        verbose_name="LA City Council District",
        db_index=True,
    )
    supervisorial_district = models.PositiveSmallIntegerField(
        choices=SUPERVISORIAL_DISTRICT_CHOICES,
        null=True,
        blank=True,
        verbose_name="Supervisorial District",
        db_index=True,
    )
    shelter_programs = models.ManyToManyField(ShelterProgram)
    shelter_programs_other = models.CharField(max_length=255, blank=True, null=True)
    funders = models.ManyToManyField(Funder)
    funders_other = models.CharField(max_length=255, blank=True, null=True)

    # Better Angels Review
    overall_rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], null=True, blank=True)
    subjective_review = CKEditor5Field(null=True, blank=True)

    # Better Angels Admin
    status = TextChoicesField(choices_enum=StatusChoices, default=StatusChoices.DRAFT)

    class Meta:
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name

    def clean(self) -> None:
        """
        Validate and clean _other fields based on whether 'other' is selected in corresponding M2M fields.

        This provides model-level validation as a second layer of defense.
        Also automatically cleans orphaned _other values.
        """
        super().clean()
        errors = {}

        for field_name in FIELDS_WITH_OTHER_OPTION:
            other_field_name = f"{field_name}_other"
            other_value = getattr(self, other_field_name, None)

            # For new instances, we can't check M2M until after save
            if self.pk:
                m2m_field = getattr(self, field_name)
                has_other = m2m_field.filter(name="other").exists()

                if has_other and not other_value:
                    errors[other_field_name] = f"This field is required when 'Other' is selected in {field_name}."
                elif not has_other and other_value:
                    # Automatically clear orphaned other text to maintain data consistency
                    setattr(self, other_field_name, None)

        if errors:
            raise ValidationError(errors)

    def save(self, *args: Any, **kwargs: Any) -> None:
        latitude = self.location.latitude if self.location else None
        longitude = self.location.longitude if self.location else None

        if latitude is not None and longitude is not None:
            self.geolocation = Point(float(longitude), float(latitude))
        else:
            self.geolocation = None

        super().save(*args, **kwargs)


@pghistory.track(
    pghistory.InsertEvent("shelter.contact_info.add"),
    pghistory.UpdateEvent("shelter.contact_info.update"),
    pghistory.DeleteEvent("shelter.contact_info.remove"),
)
class ContactInfo(models.Model):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="additional_contacts")
    contact_name = models.CharField(max_length=255, verbose_name="Contact Name")
    contact_number = PhoneNumberField(verbose_name="Contact Number")

    def __str__(self) -> str:
        return f"{self.contact_name} - {self.contact_number}"


ATTACHMENT_MAX_FILENAME_LENGTH = 100
UPLOAD_BASE_DIR = "shelters/"


def upload_path(instance: Optional[Shelter], filename: str) -> str:
    """
    Uses the default storage's get_available_name to generate a unique path
    that does not exceed the field's max_length.

    This defers deduplication logic (suffixing) to the storage backend while
    still respecting length limits.
    """
    file_path = f"{UPLOAD_BASE_DIR}{filename}"

    return default_storage.get_available_name(file_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)


class InteriorPhoto(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="interior_photos")


class ExteriorPhoto(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="exterior_photos")


class Video(BaseModel):
    file = AsyncFileField(upload_to=upload_path, max_length=ATTACHMENT_MAX_FILENAME_LENGTH)
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="videos")


# Proxy models for tracking ManyToManyField through tables
@pghistory.track(
    pghistory.InsertEvent("shelter.demographic.add"),
    pghistory.DeleteEvent("shelter.demographic.remove"),
    obj_field=None,
)
class TrackedDemographic(Shelter.demographics.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.special_restriction.add"),
    pghistory.DeleteEvent("shelter.special_restriction.remove"),
    obj_field=None,
)
class TrackedSpecialSituationRestriction(Shelter.special_situation_restrictions.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_type.add"),
    pghistory.DeleteEvent("shelter.shelter_type.remove"),
    obj_field=None,
)
class TrackedShelterType(Shelter.shelter_types.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.room_style.add"),
    pghistory.DeleteEvent("shelter.room_style.remove"),
    obj_field=None,
)
class TrackedRoomStyle(Shelter.room_styles.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.accessibility.add"),
    pghistory.DeleteEvent("shelter.accessibility.remove"),
    obj_field=None,
)
class TrackedAccessibility(Shelter.accessibility.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.storage.add"),
    pghistory.DeleteEvent("shelter.storage.remove"),
    obj_field=None,
)
class TrackedStorage(Shelter.storage.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.pet.add"),
    pghistory.DeleteEvent("shelter.pet.remove"),
    obj_field=None,
)
class TrackedPet(Shelter.pets.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.parking.add"),
    pghistory.DeleteEvent("shelter.parking.remove"),
    obj_field=None,
)
class TrackedParking(Shelter.parking.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.immediate_need.add"),
    pghistory.DeleteEvent("shelter.immediate_need.remove"),
    obj_field=None,
)
class TrackedImmediateNeed(Shelter.immediate_needs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.general_service.add"),
    pghistory.DeleteEvent("shelter.general_service.remove"),
    obj_field=None,
)
class TrackedGeneralService(Shelter.general_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.health_service.add"),
    pghistory.DeleteEvent("shelter.health_service.remove"),
    obj_field=None,
)
class TrackedHealthService(Shelter.health_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.training_service.add"),
    pghistory.DeleteEvent("shelter.training_service.remove"),
    obj_field=None,
)
class TrackedTrainingService(Shelter.training_services.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.entry_requirement.add"),
    pghistory.DeleteEvent("shelter.entry_requirement.remove"),
    obj_field=None,
)
class TrackedEntryRequirement(Shelter.entry_requirements.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.city.add"),
    pghistory.DeleteEvent("shelter.city.remove"),
    obj_field=None,
)
class TrackedCity(Shelter.cities.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.spa.add"),
    pghistory.DeleteEvent("shelter.spa.remove"),
    obj_field=None,
)
class TrackedSPA(Shelter.spa.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.shelter_program.add"),
    pghistory.DeleteEvent("shelter.shelter_program.remove"),
    obj_field=None,
)
class TrackedShelterProgram(Shelter.shelter_programs.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True


@pghistory.track(
    pghistory.InsertEvent("shelter.funder.add"),
    pghistory.DeleteEvent("shelter.funder.remove"),
    obj_field=None,
)
class TrackedFunder(Shelter.funders.through):  # type: ignore[name-defined]
    class Meta:
        proxy = True
