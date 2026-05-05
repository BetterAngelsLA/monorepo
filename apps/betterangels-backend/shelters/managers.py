import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.db.models import OuterRef, QuerySet, Subquery
from django.db.models.functions import Coalesce
from shelters.enums import ScheduleTypeChoices, ShelterPhotoTypeChoices
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

    def with_hero_image_file(self) -> "ShelterQuerySet":
        """Annotate each shelter with ``_hero_image_file`` — the file path
        of the hero image resolved entirely in SQL.

        Priority:
        1. The explicitly chosen hero image (FK → ``ShelterPhoto``).
        2. First exterior photo (by pk).
        3. First interior photo (by pk).
        """
        from shelters.models import ShelterPhoto

        hero_fk_file = Subquery(ShelterPhoto.objects.filter(pk=OuterRef("hero_image_id")).values("file")[:1])

        first_exterior = Subquery(
            ShelterPhoto.objects.filter(
                shelter=OuterRef("pk"),
                type=ShelterPhotoTypeChoices.EXTERIOR,
            )
            .order_by("pk")
            .values("file")[:1]
        )
        first_interior = Subquery(
            ShelterPhoto.objects.filter(
                shelter=OuterRef("pk"),
                type=ShelterPhotoTypeChoices.INTERIOR,
            )
            .order_by("pk")
            .values("file")[:1]
        )

        hero_file = Coalesce(hero_fk_file, first_exterior, first_interior)

        return self.annotate(_hero_image_file=hero_file)


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
