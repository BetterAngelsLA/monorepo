"""Tests for ``ScopedResource.org_paths()`` (ADR 0001 §2.3).

Pins the lookup-path resolution against the real shelter models, plus the two
declaration errors a model can make: a multi-valued hop and a hop onto a model
that does not declare ``ScopedResource``.
"""

from typing import cast

from common.models import ScopedResource
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
        class MultiValued(ScopedResource):
            org_via = ("teams",)
            teams = models.ManyToManyField("auth.Group")

            class Meta:
                app_label = "accounts"
                abstract = True

        with self.assertRaises(TypeError):
            MultiValued.org_paths()

    def test_a_hop_to_an_unscoped_model_raises(self) -> None:
        class PointsAtThing(ScopedResource):
            org_via = ("thing",)
            thing = models.ForeignKey("auth.Group", on_delete=models.CASCADE)

            class Meta:
                app_label = "accounts"
                abstract = True

        with self.assertRaises(TypeError):
            PointsAtThing.org_paths()


class OwnOrgOrTestCase(TestCase):
    """``own_org_or`` — the "own org **or** via X" reach (RFC 0003 §sub-decision 3).

    ``org_via`` alone cannot express it: it is either ``()`` (the own FK) or a
    hop tuple, never both.  Referral is the model that needs the union — a
    referral reaches an organization through its own ``organization`` FK *or*
    through the shelter it names.
    """

    def _model(self, name: str, **attrs: object) -> type[ScopedResource]:
        """An abstract ``ScopedResource`` with *attrs*, isolated from the real app registry."""
        meta, namespace = attrs.pop("Meta", None), dict(attrs)
        namespace["__module__"] = __name__
        namespace["Meta"] = meta or type("Meta", (), {"app_label": "accounts", "abstract": True})
        return cast(type[ScopedResource], type(name, (ScopedResource,), namespace))

    def test_own_org_or_adds_the_own_fk_to_the_hop_paths(self) -> None:
        from organizations.models import Organization
        from shelters.models import Shelter

        Referralish = self._model(
            "Referralish",
            org_via=("shelter",),
            own_org_or=("shelter",),
            shelter=models.ForeignKey(Shelter, on_delete=models.CASCADE, null=True),
            organization=models.ForeignKey(Organization, on_delete=models.CASCADE, null=True),
        )
        self.assertEqual(
            set(Referralish.org_paths()),
            {"organization_id", "shelter__organization_id"},
        )

    def test_own_org_or_is_not_pathed_when_unset(self) -> None:
        from shelters.models import Shelter

        HopOnly = self._model(
            "HopOnly",
            org_via=("shelter",),
            shelter=models.ForeignKey(Shelter, on_delete=models.CASCADE, null=True),
        )
        self.assertEqual(HopOnly.org_paths(), ("shelter__organization_id",))

    def test_own_org_or_without_an_organization_fk_raises(self) -> None:
        from django.core.exceptions import FieldDoesNotExist
        from shelters.models import Shelter

        Mooch = self._model(
            "Mooch",
            org_via=("shelter",),
            own_org_or=("shelter",),
            shelter=models.ForeignKey(Shelter, on_delete=models.CASCADE, null=True),
        )
        # Resolution itself refuses; ``permissions.E004`` is the deploy-time
        # backstop for the same condition, so a deploy never reaches this.
        with self.assertRaises(FieldDoesNotExist):
            Mooch.org_paths()

    def test_e004_flags_own_org_or_without_an_organization_fk(self) -> None:
        from common.permissions.checks import _org_via_errors_for_model
        from shelters.models import Shelter

        Mooch = self._model(
            "Mooch",
            org_via=("shelter",),
            own_org_or=("shelter",),
            shelter=models.ForeignKey(Shelter, on_delete=models.CASCADE, null=True),
        )
        errors = _org_via_errors_for_model(Mooch)
        self.assertTrue(any(error.id == "permissions.E004" for error in errors), errors)
