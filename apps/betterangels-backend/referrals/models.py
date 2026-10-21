import pghistory
from django.db import models
from django_choices_field import IntegerChoicesField
from organizations.models import Organization

from accounts.models import User
from common.models import BaseModel, OrgScoped


class ReferralTestShelter(BaseModel):
    """Ownership registry for shelters created by seed_referral_test_data.

    A display name never establishes fixture ownership. The command creates this
    entry and its shelter in the same transaction; reseeding reuses the shelter.
    """

    key = models.CharField(max_length=64, primary_key=True)
    shelter = models.OneToOneField("shelters.Shelter", on_delete=models.CASCADE, related_name="+")


@pghistory.track(
    pghistory.InsertEvent("referral.add"),
    pghistory.UpdateEvent("referral.update"),
    pghistory.DeleteEvent("referral.remove"),
)
class Referral(OrgScoped, BaseModel):
    """Referral, scoped to its own ``organization``.

    ``OrgScoped`` is metadata only (no fields, no migration): it declares that
    the row belongs to one organization through the ``organization`` FK below,
    which is the same relation every referral query already filters on.
    Declaring it also keeps ``permissions.E005`` satisfied if a scoped Role is
    ever granted a referral permission (the check reads Role rows from the
    database, so a stale row is enough to trip it).  ``organization`` stays
    nullable for legacy rows.
    """

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
