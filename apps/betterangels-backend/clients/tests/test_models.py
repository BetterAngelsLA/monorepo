import unittest

from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker

from clients.enums import HmisAgencyEnum, PronounEnum
from clients.models import ClientContact, ClientProfile, HmisProfile


class ClientProfileModelTestCase(TestCase):
    def test_display_pronouns(self) -> None:
        client_profile = baker.make(ClientProfile)
        self.assertIsNone(client_profile.display_pronouns)

        client_profile.pronouns = PronounEnum.HE_HIM_HIS
        client_profile.save()
        self.assertEqual(client_profile.display_pronouns, "He/Him")

        client_profile.pronouns = PronounEnum.OTHER
        client_profile.pronouns_other = "she/her/their"
        client_profile.save()
        self.assertEqual(client_profile.display_pronouns, "she/her/their")

    def test_full_name(self) -> None:
        client_profile_1 = baker.make(ClientProfile, first_name="Dale", middle_name=None, last_name="Cooper")
        self.assertEqual(client_profile_1.full_name, "Dale Cooper")

        client_profile_2 = baker.make(ClientProfile, first_name="Dale", middle_name="Bartholomew", last_name="Cooper")
        self.assertEqual(client_profile_2.full_name, "Dale Bartholomew Cooper")

    def test_save(self) -> None:
        client_profile = baker.make(ClientProfile, california_id="x1357642", email="UPPER@EXAMPLE.COM")
        self.assertEqual(client_profile.california_id, "X1357642")
        self.assertEqual(client_profile.email, "upper@example.com")

        client_profile.california_id = ""
        client_profile.email = ""
        client_profile.save()
        self.assertIsNone(client_profile.california_id)
        self.assertIsNone(client_profile.email)


class HmisProfileModelTestCase(TestCase):
    def test_hmis_profile_unique_constraint(self) -> None:
        original_hmis_profile_count = HmisProfile.objects.count()

        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID2", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.PASADENA)

        self.assertEqual(HmisProfile.objects.count(), original_hmis_profile_count + 3)

        with self.assertRaises(IntegrityError):
            baker.make(HmisProfile, hmis_id="HMISid1", agency=HmisAgencyEnum.LAHSA)


class ClientFamilyMemberReparentGuardTestCase(TestCase):
    @unittest.expectedFailure
    def test_reparent_guard_covers_deferred_loads(self) -> None:
        """M4: the guard must cover every ``save()`` path — this test is RED today.

        ``ClientFamilyMember``'s docstring says it covers "the direct mutations
        (and any other ``save()`` path)" so a payload cannot reparent a contact,
        HMIS, household, or social row.  The deferred-load path escapes it:
        ``from_db`` records the original parent only when
        ``"client_profile_id"`` is in ``field_names``, so a row fetched with
        ``.only()``/``.defer()`` leaves the marker unset, ``save()`` sees
        ``original is None`` and writes the new parent.

        This asserts the documented contract rather than the shipped behaviour:
        reparenting through a deferred instance raises ``ValidationError`` and
        leaves the row untouched.  It stays red until the guard stops depending
        on the FK column having been loaded (query the original parent, or refuse
        the save, when the marker is missing).
        """
        original_parent = baker.make(ClientProfile)
        other_parent = baker.make(ClientProfile)
        contact = baker.make(ClientContact, client_profile=original_parent, name="original")

        # Control: the fully-loaded path is already guarded.
        loaded = ClientContact.objects.get(pk=contact.pk)
        loaded.client_profile = other_parent
        with self.assertRaises(ValidationError):
            loaded.save()

        # The guard's blind spot: the same reparent through a deferred instance.
        deferred = ClientContact.objects.only("name").get(pk=contact.pk)
        self.assertNotIn("client_profile_id", deferred.__dict__)  # sanity: the FK column really is deferred

        deferred.client_profile = other_parent
        with self.assertRaises(ValidationError):
            deferred.save()

        self.assertEqual(ClientContact.objects.get(pk=contact.pk).client_profile_id, original_parent.pk)
