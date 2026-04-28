"""Core Shelter model and closely related models (Bed, Room, ContactInfo)."""

import datetime
from functools import cache
from typing import Any

import pghistory
from common.models import BaseModel
from common.permissions.utils import permission_enums_to_django_meta_permissions
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import Point
from django.db import models
from django.db.models import UniqueConstraint
from django_choices_field import TextChoicesField
from django_ckeditor_5.fields import CKEditor5Field
from organizations.models import Organization
from phonenumber_field.modelfields import PhoneNumberField
from places.fields import PlacesField
from shelters.enums import (
    CITY_COUNCIL_DISTRICT_CHOICES,
    SUPERVISORIAL_DISTRICT_CHOICES,
    BedStatusChoices,
    BedTypeChoices,
    MedicalNeedChoices,
    RoomStatusChoices,
    RoomStyleChoices,
    ScheduleTypeChoices,
    StatusChoices,
)
from shelters.managers import AdminShelterManager, ShelterManager
from shelters.permissions import ShelterFieldPermissions
from shelters.selectors import shelters_open_at

from .lookups import (
    SPA,
    Accessibility,
    City,
    Demographic,
    EntryRequirement,
    ExitPolicy,
    Funder,
    Parking,
    Pet,
    ReferralRequirement,
    RoomStyle,
    ShelterProgram,
    ShelterType,
    SpecialSituationRestriction,
    Storage,
    Vaccination,
)
from .service import Service


@pghistory.track(
    pghistory.InsertEvent("shelter.add"),
    pghistory.UpdateEvent("shelter.update"),
    pghistory.DeleteEvent("shelter.remove"),
)
class Shelter(BaseModel):
    objects: ShelterManager = ShelterManager()
    admin_objects: AdminShelterManager = AdminShelterManager()

    # Basic Information
    name = models.CharField(max_length=255)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, blank=True, null=True)
    location = PlacesField(blank=True, null=True)
    geolocation = PointField(srid=4326, geography=True, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = PhoneNumberField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    instagram = models.URLField(blank=True, null=True)

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
    curfew = models.TimeField(null=True, blank=True)
    on_site_security = models.BooleanField(null=True, blank=True)
    visitors_allowed = models.BooleanField(null=True, blank=True)
    exit_policy = models.ManyToManyField(ExitPolicy)
    exit_policy_other = models.CharField(max_length=255, blank=True, null=True)
    emergency_surge = models.BooleanField(verbose_name="Emergency Capacity Surge Options", null=True, blank=True)
    other_rules = CKEditor5Field(null=True, blank=True)

    # Services Offered
    services = models.ManyToManyField(Service, blank=True)
    other_services = CKEditor5Field(verbose_name="Additional Notes", null=True, blank=True)

    # Entry Requirements
    entry_info = CKEditor5Field(null=True, blank=True)
    entry_requirements = models.ManyToManyField(EntryRequirement)
    referral_requirement = models.ManyToManyField(ReferralRequirement)
    vaccinations = models.ManyToManyField(Vaccination)
    bed_fees = models.CharField(max_length=255, blank=True, null=True)
    program_fees = models.CharField(max_length=255, blank=True, null=True)

    # Ecosystem Information
    cities = models.ManyToManyField(City)

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
    declined_ba_visit = models.BooleanField(default=False, verbose_name="Declined BA Visit")

    # Better Angels Admin
    status = TextChoicesField(choices_enum=StatusChoices, default=StatusChoices.DRAFT)

    class Meta:
        indexes = [models.Index(fields=["status"])]
        permissions = permission_enums_to_django_meta_permissions([ShelterFieldPermissions])

    def __str__(self) -> str:
        return self.name

    def is_open_at(
        self,
        dt: datetime.datetime,
        schedule_type: ScheduleTypeChoices | None = None,
    ) -> bool:
        """Return whether this shelter is open at *dt* per its schedule."""
        if schedule_type is None:
            schedule_type = ScheduleTypeChoices.OPERATING
        return shelters_open_at(
            type(self).objects.filter(pk=self.pk),
            dt=dt,
            schedule_type=schedule_type,
        ).exists()

    def save(self, *args: Any, **kwargs: Any) -> None:
        latitude = self.location.latitude if self.location else None
        longitude = self.location.longitude if self.location else None

        if latitude is not None and longitude is not None:
            self.geolocation = Point(float(longitude), float(latitude))
        else:
            self.geolocation = None

        super().save(*args, **kwargs)


class Bed(BaseModel):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="beds")
    room = models.ForeignKey("Room", on_delete=models.SET_NULL, blank=True, null=True, related_name="beds")
    bed_name = models.CharField(max_length=255, blank=True, null=True)
    status = TextChoicesField(choices_enum=BedStatusChoices, blank=True, null=True)
    status_notes = models.TextField(blank=True, null=True)
    occupant = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="occupied_beds",
    )
    bed_type = TextChoicesField(choices_enum=BedTypeChoices, blank=True, null=True)
    demographics = models.ManyToManyField(Demographic, blank=True)
    accessibility = models.ManyToManyField(Accessibility, blank=True)
    funders = models.ManyToManyField(Funder, blank=True)
    pets = models.ManyToManyField(Pet, blank=True)
    storage = models.BooleanField(default=False, blank=True)
    maintenance_flag = models.BooleanField(default=False, blank=True)
    last_cleaned_inspected = models.DateTimeField(blank=True, null=True)
    medical_needs = TextChoicesField(choices_enum=MedicalNeedChoices, blank=True, null=True)
    b7 = models.BooleanField(default=False, blank=True)
    fees = models.PositiveIntegerField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["shelter", "status"]),
        ]


class Room(BaseModel):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="rooms")
    room_identifier = models.CharField(max_length=255)
    room_type = TextChoicesField(choices_enum=RoomStyleChoices, blank=True, null=True)
    room_type_other = models.CharField(max_length=255, blank=True, null=True)
    status = TextChoicesField(choices_enum=RoomStatusChoices, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    amenities = models.TextField(blank=True, null=True)
    demographics = models.ManyToManyField(Demographic, blank=True)
    accessibility = models.ManyToManyField(Accessibility, blank=True)
    funders = models.ManyToManyField(Funder, blank=True)
    pets = models.ManyToManyField(Pet, blank=True)
    storage = models.BooleanField(default=False, blank=True)
    maintenance_flag = models.BooleanField(default=False, blank=True)
    occupants = models.ManyToManyField("clients.ClientProfile", blank=True, related_name="occupied_rooms")
    medical_respite = models.BooleanField(default=False, blank=True)
    last_cleaned_inspected = models.DateTimeField(blank=True, null=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["shelter", "room_identifier"],
                name="unique_room_per_shelter",
            )
        ]
        indexes = [
            models.Index(fields=["shelter", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.shelter.name} - {self.room_identifier}"


@pghistory.track(
    pghistory.InsertEvent("shelter.contact_info.add"),
    pghistory.UpdateEvent("shelter.contact_info.update"),
    pghistory.DeleteEvent("shelter.contact_info.remove"),
)
class ContactInfo(models.Model):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="additional_contacts")
    contact_name = models.CharField(max_length=255, verbose_name="Contact Name")
    contact_number = PhoneNumberField(verbose_name="Contact Number")
    contact_email = models.EmailField(blank=True, null=True)
    contact_title = models.CharField(max_length=255, blank=True, null=True)
    is_claimant = models.BooleanField(default=False, db_index=True)

    def __str__(self) -> str:
        return f"{self.contact_name} - {self.contact_number}"


def _get_fields_with_other_option() -> list[str]:
    """
    Auto-detect fields that have the 'other' pattern by finding fields ending with '_other'
    that have a corresponding M2M field.

    Returns:
        List of base field names (without '_other' suffix) that have the other pattern
    """
    return [
        field.name[:-6]  # Remove '_other' suffix
        for field in Shelter._meta.get_fields()
        if isinstance(field, models.CharField)
        and field.name.endswith("_other")
        and hasattr(Shelter, field.name[:-6])  # Check if base M2M field exists
    ]


# Fields that have corresponding _other text fields for "Please specify..." pattern
# Auto-detected by finding fields ending with '_other' that have a corresponding M2M field
# Used by both form validation (admin.py) and model validation (clean method)
@cache
def get_fields_with_other_option() -> list[str]:
    """
    Auto-detect and cache fields with the 'other' pattern (M2M + _other CharField).

    Uses @cache decorator for lazy evaluation and automatic caching without manual state.
    """
    return _get_fields_with_other_option()
