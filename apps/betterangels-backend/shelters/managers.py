from typing import TYPE_CHECKING

from django.db import models
from django.db.models import Exists, OuterRef, QuerySet

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter


class AdminShelterQuerySet(QuerySet):
    def for_user(self, user: "User") -> "QuerySet[Shelter]":
        from organizations.models import Organization

        user_org_membership = Organization.objects.filter(pk=OuterRef("organization_id"), users=user)

        return self.filter(Exists(user_org_membership))


class AdminShelterManager(models.Manager):
    def get_queryset(self) -> AdminShelterQuerySet:
        return AdminShelterQuerySet(self.model, using=self._db)

    def for_user(self, user: "User") -> "QuerySet[Shelter]":
        return self.get_queryset().for_user(user)
