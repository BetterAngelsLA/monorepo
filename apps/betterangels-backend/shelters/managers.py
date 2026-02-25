from typing import TYPE_CHECKING

from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Case, OuterRef, QuerySet, Subquery, When
from django.db.models.functions import Coalesce
from shelters.selectors import admin_shelter_list, shelter_list

if TYPE_CHECKING:
    from accounts.models import User
    from shelters.models import Shelter  # noqa: F401


class ShelterQuerySet(QuerySet["Shelter"]):
    def approved(self) -> "ShelterQuerySet":
        return shelter_list(self)  # type: ignore[return-value]

    def with_hero_image_file(self) -> "ShelterQuerySet":
        """Annotate each shelter with ``_hero_image_file`` — the file path
        of the hero image resolved entirely in SQL.

        Priority:
        1. The explicitly chosen hero image (GFK → ExteriorPhoto or
           InteriorPhoto).
        2. First exterior photo (by pk).
        3. First interior photo (by pk).
        """
        from shelters.models import ExteriorPhoto, InteriorPhoto

        exterior_ct = ContentType.objects.get_for_model(ExteriorPhoto)
        interior_ct = ContentType.objects.get_for_model(InteriorPhoto)

        # GFK target: resolve hero_image_object_id against the correct
        # photo table based on hero_image_content_type.
        gfk_file = Case(
            When(
                hero_image_content_type=exterior_ct,
                then=Subquery(
                    ExteriorPhoto.objects.filter(
                        pk=OuterRef("hero_image_object_id"),
                    ).values(
                        "file"
                    )[:1]
                ),
            ),
            When(
                hero_image_content_type=interior_ct,
                then=Subquery(
                    InteriorPhoto.objects.filter(
                        pk=OuterRef("hero_image_object_id"),
                    ).values(
                        "file"
                    )[:1]
                ),
            ),
        )

        # Fallback: first photo by pk
        first_exterior = Subquery(
            ExteriorPhoto.objects.filter(
                shelter=OuterRef("pk"),
            )
            .order_by("pk")
            .values("file")[:1]
        )
        first_interior = Subquery(
            InteriorPhoto.objects.filter(
                shelter=OuterRef("pk"),
            )
            .order_by("pk")
            .values("file")[:1]
        )

        # Coalesce: GFK target → first exterior → first interior
        hero_file = Coalesce(gfk_file, first_exterior, first_interior)

        return self.annotate(_hero_image_file=hero_file)


class ShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> ShelterQuerySet:
        return ShelterQuerySet(self.model, using=self._db)

    def approved(self) -> ShelterQuerySet:
        return self.get_queryset().approved()


class AdminShelterQuerySet(ShelterQuerySet):
    def for_user(self, user: "User") -> "AdminShelterQuerySet":
        return admin_shelter_list(self, user=user)  # type: ignore[return-value]


class AdminShelterManager(models.Manager["Shelter"]):
    def get_queryset(self) -> AdminShelterQuerySet:
        return AdminShelterQuerySet(self.model, using=self._db)

    def for_user(self, user: "User") -> AdminShelterQuerySet:
        return self.get_queryset().for_user(user)
