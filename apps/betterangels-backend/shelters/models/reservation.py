"""Reservation-related shelter models."""

from typing import Any

import pghistory
from common.models import BaseModel
from django.core.exceptions import NON_FIELD_ERRORS, ValidationError
from django.db import models
from django.db.models import UniqueConstraint
from django.utils import timezone
from django_choices_field import TextChoicesField
from shelters.enums import ReservationStatusChoices

from .shelter import ACTIVE_RESERVATION_STATUSES, Bed, Room, Shelter


@pghistory.track(
    pghistory.InsertEvent("reservation.add"),
    pghistory.DeleteEvent("reservation.remove"),
    pghistory.UpdateEvent("reservation.status_change", condition=pghistory.AnyChange("status")),
)
class Reservation(BaseModel):
    shelter = models.ForeignKey(Shelter, on_delete=models.CASCADE, related_name="reservations")
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
            models.Index(fields=["shelter", "status"]),
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

        # If bed is assigned, validate bed
        if self.bed and not errors:
            if self.bed.maintenance_flag:
                errors["bed"] = "The selected bed is out of service."
            elif self._is_bed_in_turnaround():
                errors["bed"] = "The selected bed is currently in turnaround."
            else:
                # Check for conflicting active reservations on this bed.
                conflicting_qs = Reservation.objects.filter(
                    bed_id=self.bed.pk,
                    status__in=ACTIVE_RESERVATION_STATUSES,
                )
                if self.pk:
                    conflicting_qs = conflicting_qs.exclude(pk=self.pk)
                if conflicting_qs.exists():
                    errors["bed"] = "This bed already has an active reservation."

        # If room is assigned but bed is not (room-only), validate room
        if self.room and not self.bed and not errors:
            if self.room.maintenance_flag:
                errors["room"] = "The selected room is out of service."
            elif self._is_room_in_turnaround():
                errors["room"] = "The selected room is currently in turnaround."
            else:
                # Check for conflicting active room-only reservations.
                conflicting_qs = Reservation.objects.filter(
                    room_id=self.room.pk,
                    bed__isnull=True,
                    status__in=ACTIVE_RESERVATION_STATUSES,
                )
                if self.pk:
                    conflicting_qs = conflicting_qs.exclude(pk=self.pk)
                if conflicting_qs.exists():
                    errors["room"] = "This room already has an active room-only reservation."

        if errors:
            raise ValidationError(errors)

    def _is_bed_in_turnaround(self) -> bool:
        """Return True if the assigned bed is in turnaround (last checkout after last cleaned)."""
        if not self.bed:
            return False
        last_checkout = self.bed._get_last_completed_checkout()
        if not last_checkout:
            return False
        return self.bed.last_cleaned is None or self.bed.last_cleaned <= last_checkout

    def _is_room_in_turnaround(self) -> bool:
        """Return True if the assigned room is in turnaround (last checkout after last cleaned)."""
        if not self.room:
            return False
        last_checkout = self.room._get_last_completed_checkout()
        if not last_checkout:
            return False
        return self.room.last_cleaned is None or self.room.last_cleaned <= last_checkout

    def save(self, *args: Any, **kwargs: Any) -> None:
        if self.pk:
            try:
                previous = Reservation.objects.get(pk=self.pk)

                if (
                    self.status == ReservationStatusChoices.COMPLETED
                    and previous.status != ReservationStatusChoices.COMPLETED
                ):
                    self.checked_out_at = timezone.now()

                if (
                    self.status == ReservationStatusChoices.CHECKED_IN
                    and previous.status != ReservationStatusChoices.CHECKED_IN
                ):
                    self.checked_in_at = timezone.now()

            except Reservation.DoesNotExist:
                pass

        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Reservation #{self.pk} at {self.shelter} ({self.status})"


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
