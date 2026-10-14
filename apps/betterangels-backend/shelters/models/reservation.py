from __future__ import annotations

from typing import TYPE_CHECKING

import pghistory
from common.models import BaseModel, OrgScoped
from django.core.exceptions import NON_FIELD_ERRORS, ValidationError
from django.db import models
from django.db.models import UniqueConstraint
from django_choices_field import TextChoicesField
from shelters.enums import ReservationStatusChoices

from .shelter import ACTIVE_RESERVATION_STATUSES, Bed, Room

if TYPE_CHECKING:
    from .shelter import Shelter


@pghistory.track(
    pghistory.InsertEvent("reservation.add"),
    pghistory.DeleteEvent("reservation.remove"),
    # These two update triggers are mutually exclusive: ``status_change`` fires
    # only when ``status`` changes, and ``update`` excludes ``status``, so a
    # status change writes exactly one row (with its own diff) rather than two.
    # ``updated_at`` is excluded alongside ``status`` because it is ``auto_now``
    # and would otherwise make every save (including a bare status change) match
    # ``update`` — the pair is only disjoint once the mechanical column is out.
    pghistory.UpdateEvent("reservation.status_change", condition=pghistory.AnyChange("status")),
    pghistory.UpdateEvent("reservation.update", condition=pghistory.AnyChange(exclude=["status", "updated_at"])),
    meta={"indexes": [models.Index(fields=["pgh_obj", "pgh_id"], name="reservation_evt_obj_idx")]},
    append_only=True,
)
class Reservation(OrgScoped, BaseModel):
    org_via = ("bed", "room")

    room = models.ForeignKey(Room, on_delete=models.SET_NULL, blank=True, null=True, related_name="reservations")
    bed = models.ForeignKey(Bed, on_delete=models.SET_NULL, blank=True, null=True, related_name="reservations")
    status = TextChoicesField(choices_enum=ReservationStatusChoices, default=ReservationStatusChoices.CONFIRMED)
    start_date = models.DateField(blank=True, null=True)
    duration = models.PositiveIntegerField(help_text="Duration in days", blank=True, null=True)
    clients: models.ManyToManyField = models.ManyToManyField(
        "clients.ClientProfile", through="ReservationClient", related_name="reservations"
    )
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, blank=True, null=True, related_name="created_reservations"
    )
    checked_in_at = models.DateTimeField(blank=True, null=True)
    checked_out_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["bed", "status", "checked_out_at"], name="reservation_bed_status_co_idx"),
            models.Index(fields=["bed", "status"], name="reservation_bed_status_idx"),
            models.Index(fields=["room", "status", "checked_out_at"], name="reservation_room_status_co_idx"),
            models.Index(fields=["room", "status"], name="reservation_room_status_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["bed"],
                condition=models.Q(status__in=ACTIVE_RESERVATION_STATUSES),
                name="unique_active_reservation_per_bed",
            ),
            models.UniqueConstraint(
                fields=["room"],
                condition=models.Q(status__in=ACTIVE_RESERVATION_STATUSES, bed__isnull=True),
                name="unique_active_reservation_per_room",
            ),
        ]

    def clean(self) -> None:
        super().clean()

        errors: dict[str, str] = {}

        if not self.bed and not self.room:
            errors[NON_FIELD_ERRORS] = "A reservation must have a bed or room assigned."

        if self.bed and self.room:
            if self.bed.shelter_id != self.room.shelter_id:
                errors[NON_FIELD_ERRORS] = "Bed and room must belong to the same shelter."
            elif self.bed.room_id and self.bed.room_id != self.room.pk:
                errors["bed"] = "The selected bed does not belong to the selected room."

        if errors:
            raise ValidationError(errors)

    @property
    def shelter(self) -> Shelter | None:
        """Return the shelter for this reservation, resolved via bed or room."""
        if self.bed_id:
            return self.bed.shelter  # type: ignore[union-attr]
        if self.room_id:
            return self.room.shelter  # type: ignore[union-attr]
        return None

    def __str__(self) -> str:
        shelter = self.shelter or "No Shelter"

        return f"Reservation #{self.pk} at {shelter} ({self.status})"


@pghistory.track(
    pghistory.InsertEvent("reservation_client.add"),
    pghistory.UpdateEvent("reservation_client.update"),
    pghistory.DeleteEvent("reservation_client.remove"),
    meta={"indexes": [models.Index(fields=["pgh_obj", "pgh_id"], name="resclient_evt_obj_idx")]},
    append_only=True,
)
class ReservationClient(BaseModel):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="reservation_clients")
    client_profile = models.ForeignKey(
        "clients.ClientProfile", on_delete=models.CASCADE, related_name="reservation_clients"
    )
    is_primary = models.BooleanField(default=False)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["reservation", "client_profile"],
                name="unique_client_per_reservation",
            ),
            UniqueConstraint(
                fields=["reservation"],
                condition=models.Q(is_primary=True),
                name="unique_primary_client_per_reservation",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.client_profile} - Reservation #{self.reservation.pk}"
