"""Reservation-related shelter models."""

from common.models import BaseModel
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import UniqueConstraint
from django_choices_field import TextChoicesField
from shelters.enums import ReservationStatusChoices

from .shelter import Bed, Room, Shelter


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

    def clean(self) -> None:
        super().clean()
        errors = {}
        shelter_pk = self.shelter.pk
        if self.room and shelter_pk is not None and self.room.shelter_id != shelter_pk:
            errors["room"] = "The selected room must belong to the same shelter as the reservation."
        if self.bed and shelter_pk is not None and self.bed.shelter_id != shelter_pk:
            errors["bed"] = "The selected bed must belong to the same shelter as the reservation."
        if errors:
            raise ValidationError(errors)

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
