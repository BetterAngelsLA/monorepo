"""Tests for ``OrgScoped.org_paths()`` (ADR 0001 §2.3).

Pins the lookup-path resolution against the real shelter models, plus the two
declaration errors a model can make: a multi-valued hop and a hop onto a model
that does not declare ``OrgScoped``.
"""

from common.models import OrgScoped
from django.db import models
from django.test import TestCase
from shelters.models import Bed, Reservation, Room, Shelter, ShelterPhoto


class OrgPathsTestCase(TestCase):
    def test_shelter_resolves_its_own_organization(self) -> None:
        self.assertEqual(Shelter.org_paths(), ("organization_id",))

    def test_bed_and_room_reach_the_shelter_organization(self) -> None:
        self.assertEqual(Bed.org_paths(), ("shelter__organization_id",))
        self.assertEqual(Room.org_paths(), ("shelter__organization_id",))

    def test_reservation_reaches_an_organization_through_bed_or_room(self) -> None:
        self.assertEqual(
            set(Reservation.org_paths()),
            {"bed__shelter__organization_id", "room__shelter__organization_id"},
        )

    def test_shelter_photo_reaches_the_shelter_organization(self) -> None:
        self.assertEqual(ShelterPhoto.org_paths(), ("shelter__organization_id",))

    def test_org_paths_are_cached_per_class(self) -> None:
        self.assertIs(Shelter.org_paths(), Shelter.org_paths())

    def test_shelter_child_models_reach_the_shelter_organization(self) -> None:
        from shelters.models.availability import ShelterAvailability
        from shelters.models.media import MediaLink, Video
        from shelters.models.schedule import Schedule
        from shelters.models.shelter import ContactInfo

        self.assertEqual(Video.org_paths(), ("shelter__organization_id",))
        self.assertEqual(MediaLink.org_paths(), ("shelter__organization_id",))
        self.assertEqual(Schedule.org_paths(), ("shelter__organization_id",))
        self.assertEqual(ShelterAvailability.org_paths(), ("shelter__organization_id",))
        self.assertEqual(ContactInfo.org_paths(), ("shelter__organization_id",))

    def test_platform_shared_models_declare_no_org_paths(self) -> None:
        from clients.models import ClientProfile

        self.assertEqual(ClientProfile.org_paths(), ())

    def test_a_multi_valued_hop_raises(self) -> None:
        class MultiValued(OrgScoped):
            org_via = ("teams",)
            teams = models.ManyToManyField("auth.Group")

            class Meta:
                app_label = "accounts"
                abstract = True

        with self.assertRaises(TypeError):
            MultiValued.org_paths()

    def test_a_hop_to_an_unscoped_model_raises(self) -> None:
        class PointsAtThing(OrgScoped):
            org_via = ("thing",)
            thing = models.ForeignKey("auth.Group", on_delete=models.CASCADE)

            class Meta:
                app_label = "accounts"
                abstract = True

        with self.assertRaises(TypeError):
            PointsAtThing.org_paths()
