"""Object-grant lifecycle and reach (ADR 0001 §2.5).

Pins the two runtime halves of the arm that the schema alone cannot express: the
``org_via`` cascade (a grant on an ancestor covers its descendants, through every
route) and the ``post_delete`` cleanup that keeps a generic ``scope_object``
pointer from outliving the row it names.
"""

from unittest.mock import patch

from accounts.models import Grant, Role, User
from common.models import Attachment
from common.permissions.selectors import object_grant_ancestors
from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from model_bakery import baker
from shelters.models import Bed, Reservation


class ObjectGrantCleanupTestCase(TestCase):
    """A deleted row must not leave a grant pointing at its id (finding F3)."""

    def test_deleting_a_granted_row_drops_its_object_grant(self) -> None:
        user = baker.make(User)
        role = Role.objects.create(name="Doc Editor")
        content_type = ContentType.objects.get_for_model(Attachment)
        attachment = baker.make(Attachment)
        grant = Grant.objects.create(
            principal_user=user, role=role, scope_object_type=content_type, scope_object_id=attachment.pk
        )

        attachment.delete()

        self.assertFalse(Grant.objects.filter(pk=grant.pk).exists())

    def test_an_unrelated_object_grant_survives(self) -> None:
        user = baker.make(User)
        role = Role.objects.create(name="Doc Editor")
        content_type = ContentType.objects.get_for_model(Attachment)
        kept, removed = baker.make(Attachment), baker.make(Attachment)
        grant = Grant.objects.create(
            principal_user=user, role=role, scope_object_type=content_type, scope_object_id=kept.pk
        )
        Grant.objects.create(principal_user=user, role=role, scope_object_type=content_type, scope_object_id=removed.pk)

        removed.delete()

        self.assertTrue(Grant.objects.filter(pk=grant.pk).exists())
        self.assertEqual(Grant.objects.filter(scope_object_type=content_type).count(), 1)


class ObjectGrantCascadeTestCase(TestCase):
    """A grant on an ancestor covers descendants, through *every* route to it."""

    def test_a_model_without_org_reach_has_no_ancestors(self) -> None:
        """``Attachment`` is ``org_via = None``: its arm is direct-grant-only."""
        self.assertIsNone(Attachment.org_via)
        self.assertEqual(object_grant_ancestors(Attachment), [])

    def test_ancestors_are_only_object_grantable_models(self) -> None:
        """Shelter is not whitelisted, so nothing above a Bed is emitted today."""
        self.assertEqual(object_grant_ancestors(Bed), [])

    def test_reservation_reaches_its_shelter_by_both_bed_and_room(self) -> None:
        """The multi-route case: one path per way the ancestor is reachable.

        A single-hop implementation would emit only ``bed__shelter__id`` and let a
        grant on the shelter miss every reservation made through a room.
        """
        import common.permissions.config as config

        try:
            with patch.object(config, "OBJECT_GRANT_WHITELIST", frozenset({"shelters.shelter"})):
                try:
                    delattr(Reservation, "_object_grant_ancestors")
                except AttributeError:
                    pass
                paths = {path for _ancestor, path in object_grant_ancestors(Reservation)}
        finally:
            try:
                delattr(Reservation, "_object_grant_ancestors")
            except AttributeError:
                pass

        self.assertEqual(paths, {"bed__shelter__id", "room__shelter__id"})
