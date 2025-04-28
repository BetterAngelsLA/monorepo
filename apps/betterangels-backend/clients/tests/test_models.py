from clients.enums import HmisAgencyEnum, PronounEnum
from clients.models import ClientProfile, HmisProfile
from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker


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
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID2", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.PASADENA)

        with self.assertRaises(IntegrityError):
            baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
