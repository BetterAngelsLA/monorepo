import pghistory
from accounts.models import User
from common.models import BaseModel
from django.db import models
from django_choices_field import IntegerChoicesField
from organizations.models import Organization


@pghistory.track(
    pghistory.InsertEvent("referral.add"),
    pghistory.UpdateEvent("referral.update"),
    pghistory.DeleteEvent("referral.remove"),
)
class Referral(BaseModel):

    class Status(models.IntegerChoices):
        PENDING = 0, "Pending"
        ACCEPTED = 1, "Accepted"
        DECLINED = 2, "Declined"

    client_profile = models.ForeignKey(
        "clients.ClientProfile",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="referrals",
    )
    shelter = models.ForeignKey(
        "shelters.Shelter",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="referrals",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="referrals",
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        related_name="referrals",
    )
    status = IntegerChoicesField(
        Status,
        default=Status.PENDING,
        db_index=True,
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self) -> str:
        client = str(self.client_profile) if self.client_profile else "Unknown Client"
        shelter = str(self.shelter) if self.shelter else "Unknown Shelter"
        return f"Referral: {client} → {shelter}"

    class Meta:
        ordering = ["-created_at"]
