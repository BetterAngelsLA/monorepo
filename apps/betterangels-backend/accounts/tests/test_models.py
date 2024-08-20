from accounts.enums import HmisAgencyEnum, PronounEnum
from accounts.models import ClientProfile, HmisProfile, User
from accounts.utils import remove_organization_permission_group
from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase

from .baker_recipes import organization_recipe, permission_group_recipe


class UserModelTestCase(ParametrizedTestCase, TestCase):
    def test_str_method(self) -> None:
        user_with_name = baker.make(User, first_name="Dale", last_name="Cooper")
        user_without_name = baker.make(User)

        self.assertEqual(f"{user_with_name}", "Dale Cooper")
        self.assertEqual(f"{user_without_name}", f"{user_without_name.pk}")

    def test_full_name(self) -> None:
        user_1 = baker.make(User, first_name="Dale", middle_name=None, last_name="Cooper")
        self.assertEqual(user_1.full_name, "Dale Cooper")

        user_2 = baker.make(User, first_name="Dale", middle_name="Bartholomew", last_name="Cooper")
        self.assertEqual(user_2.full_name, "Dale Bartholomew Cooper")

    def test_is_outreach_authorized(self) -> None:
        authorized_org = organization_recipe.make(name="authorized org")
        unauthorized_org = organization_recipe.make(name="unauthorized org")

        (
            user_in_auth_org,
            user_in_unauth_org,
            user_in_both_orgs,
            user_in_no_orgs,
        ) = baker.make(User, _quantity=4)

        authorized_org.add_user(user_in_auth_org)
        authorized_org.add_user(user_in_both_orgs)
        unauthorized_org.add_user(user_in_both_orgs)
        unauthorized_org.add_user(user_in_unauth_org)

        remove_organization_permission_group(unauthorized_org)

        permission_group_recipe.make(
            name="unauthorized permission group",
            organization=unauthorized_org,
        )

        self.assertTrue(user_in_auth_org.is_outreach_authorized)
        self.assertTrue(user_in_both_orgs.is_outreach_authorized)
        self.assertFalse(user_in_unauth_org.is_outreach_authorized)
        self.assertFalse(user_in_no_orgs.is_outreach_authorized)

    def test_display_pronouns(self) -> None:
        client_profile = baker.make(ClientProfile)
        self.assertIsNone(client_profile.display_pronouns)

        client_profile.pronouns = PronounEnum.HE_HIM_HIS
        client_profile.save()
        self.assertEqual(client_profile.display_pronouns, PronounEnum.HE_HIM_HIS.label)

        client_profile.pronouns = PronounEnum.OTHER
        client_profile.pronouns_other = "she/her/their"
        client_profile.save()
        self.assertEqual(client_profile.display_pronouns, "she/her/their")


class HmisProfileModelTestCase(TestCase):
    def test_hmis_profile_unique_constraint(self) -> None:
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID2", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.PASADENA)

        with self.assertRaises(IntegrityError):
            baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
