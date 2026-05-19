"""ShelterAvailability model — tracks bed availability for shelters."""

import pghistory
from common.models import BaseModel
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from .shelter import Shelter


@pghistory.track(
    pghistory.InsertEvent("shelter.availability.add"),
    pghistory.UpdateEvent("shelter.availability.update"),
    pghistory.DeleteEvent("shelter.availability.remove"),
)
class ShelterAvailability(BaseModel):
    objects: models.Manager["ShelterAvailability"] = models.Manager()

    shelter = models.ForeignKey(
        Shelter,
        on_delete=models.CASCADE,
        related_name="availabilities",
    )
    non_restricted_beds = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of non-restricted beds available.",
    )
    restricted_beds = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of restricted beds available.",
    )
    restriction_notes = models.TextField(
        blank=True,
        default="",
        help_text="Global restriction note for this availability record.",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shelter_availability_updates",
    )

    class Meta:
        verbose_name = "Shelter Availability"
        verbose_name_plural = "Shelter Availabilities"
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"{self.shelter.name} — {self.non_restricted_beds} non-restricted / {self.restricted_beds} restricted"
