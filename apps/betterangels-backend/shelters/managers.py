import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import QuerySet
from shelters.enums import ScheduleTypeChoices
from shelters.selectors import admin_shelter_list, shelter_list, shelters_open_at

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter  # noqa: F401


class ShelterQuerySet(QuerySet["Shelter"]):
    def approved(self) -> "ShelterQuerySet":
        return shelter_list(self)  # type: ignore[return-value]

    def open_at(
        self,
        dt: datetime.datetime,
        schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
    ) -> "ShelterQuerySet":
        """Shelters whose *schedule_type* schedule says they are open at *dt*."""
        return shelters_open_at(self, dt=dt, schedule_type=schedule_type)  # type: ignore[return-value]


class ShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> ShelterQuerySet:
        return ShelterQuerySet(self.model, using=self._db)

    def approved(self) -> ShelterQuerySet:
        return self.get_queryset().approved()

    def open_at(
        self,
        dt: datetime.datetime,
        schedule_type: ScheduleTypeChoices = ScheduleTypeChoices.OPERATING,
    ) -> ShelterQuerySet:
        return self.get_queryset().open_at(dt, schedule_type)


class AdminShelterQuerySet(ShelterQuerySet):
    def for_user(self, user: "User") -> "AdminShelterQuerySet":
        return admin_shelter_list(self, user=user)  # type: ignore[return-value]


class AdminShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> AdminShelterQuerySet:
        return AdminShelterQuerySet(self.model, using=self._db)

    def for_user(self, user: "User") -> AdminShelterQuerySet:
        return self.get_queryset().for_user(user)
