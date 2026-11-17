"""ShelterAvailability model — tracks bed availability for shelters."""

import pghistory
import pgtrigger
from django.core.validators import MinValueValidator
from django.db import models

from common.models import BaseModel, OrgScoped
from shelters.validators import validate_availability_counts

from .shelter import Shelter

# The availability columns a payload may write.  The row also carries FKs and
# timestamps that must never be payload-controlled.  One tuple so the admin form,
# the ORM write path and the GraphQL input cannot drift apart.
AVAILABILITY_FIELDS = ("non_restricted_beds", "restricted_beds", "restriction_notes")


@pghistory.track(
    pghistory.InsertEvent("shelter.availability.add"),
    pghistory.UpdateEvent("shelter.availability.update"),
    pghistory.DeleteEvent("shelter.availability.remove"),
    meta={
        "indexes": [
            models.Index(fields=["pgh_obj", "pgh_id"], name="shelteravail_evt_obj_idx"),
            models.Index(fields=["shelter", "pgh_id"], name="shelteravail_evt_shltr_idx"),
            models.Index(fields=["pgh_created_at"], name="shelteravail_evt_ca_idx"),
        ],
        "triggers": [pgtrigger.Protect(name="protect_updates", operation=pgtrigger.Update)],
    },
)
class ShelterAvailability(OrgScoped, BaseModel):
    """Bed availability for a shelter.

    The model permissions guard the standalone availability admin only: the
    shelter admin form and ``updateShelter`` write this row under
    ``change_shelter``, like any other shelter field.
    """

    org_via = ("shelter",)

    objects: models.Manager["ShelterAvailability"] = models.Manager()

    shelter = models.OneToOneField(
        Shelter,
        on_delete=models.CASCADE,
        related_name="availability",
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

    class Meta:
        verbose_name = "Shelter Availability"
        verbose_name_plural = "Shelter Availabilities"
        ordering = ["-updated_at"]

    def clean(self) -> None:
        super().clean()
        # ``clean_fields()`` has already reported the missing FK; dereferencing
        # ``self.shelter`` here would raise ``RelatedObjectDoesNotExist`` (an
        # ``AttributeError``, not a ``ValidationError``) and turn the admin's
        # add form into a 500.
        if not self.shelter_id:
            return
        validate_availability_counts(
            non_restricted_beds=self.non_restricted_beds,
            restricted_beds=self.restricted_beds,
            total_beds=self.shelter.total_beds,
        )

    def __str__(self) -> str:
        return f"{self.shelter.name} — {self.non_restricted_beds} non-restricted / {self.restricted_beds} restricted"
