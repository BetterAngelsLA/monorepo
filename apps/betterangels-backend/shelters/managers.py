from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Exists, OuterRef, QuerySet
from organizations.models import Organization
from shelters.enums import StatusChoices

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter  # noqa: F401


class ShelterQuerySet(QuerySet["Shelter"]):
    def approved(self) -> "ShelterQuerySet":
        return self.filter(status=StatusChoices.APPROVED)


class ShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> ShelterQuerySet:
        return ShelterQuerySet(self.model, using=self._db)

    def approved(self) -> ShelterQuerySet:
        return self.get_queryset().approved()


class AdminShelterQuerySet(ShelterQuerySet):
    def for_user(self, user: "User") -> "AdminShelterQuerySet":
        user_org_membership = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)
        return self.filter(Exists(user_org_membership))


class AdminShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> AdminShelterQuerySet:
        return AdminShelterQuerySet(self.model, using=self._db)

    def for_user(self, user: "User") -> AdminShelterQuerySet:
        return self.get_queryset().for_user(user)
