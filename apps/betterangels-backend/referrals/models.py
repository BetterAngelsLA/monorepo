import pghistory
from accounts.models import User
from common.models import Access, BaseModel, ScopedResource
from common.permissions.registry import PermissionSet
from django.db import models
from django_choices_field import IntegerChoicesField
from organizations.models import Organization


@pghistory.track(
    pghistory.InsertEvent("referral.add"),
    pghistory.UpdateEvent("referral.update"),
    pghistory.DeleteEvent("referral.remove"),
)
class Referral(ScopedResource, BaseModel):
    """A referral from a caseworker to a shelter (RFC 0003 §sub-decision 3).

    Reach is "own org **or** via the shelter it names", which ``org_via`` alone
    cannot express — it is either ``()`` (the model's own FK) or a hop tuple,
    never both — so this is the model ``own_org_or`` exists for.  Both anchors
    are nullable (``SET_NULL``), so a row with neither is an orphan: it matches no
    organization and answers to the global tier only, never to every org.
    """

    org_via = ("shelter",)
    own_org_or = ("shelter",)
    access = Access()

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

    class perms(PermissionSet):
        pass

    class Meta:
        ordering = ["-created_at"]
