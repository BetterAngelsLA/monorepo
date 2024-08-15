from accounts.enums import HmisAgencyEnum
from accounts.models import HmisProfile, User
from accounts.utils import remove_organization_permission_group
from django.db import IntegrityError
from django.test import TestCase
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize

from .baker_recipes import organization_recipe


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

    @parametrize(
        "user_is_in_authorized_org, user_is_in_unauthorized_org, should_succeed",
        [
            (True, True, True),
            (True, False, True),
            (False, True, False),
        ],
    )
    def test_is_outreach_authorized(
        self,
        user_is_in_authorized_org: bool,
        user_is_in_unauthorized_org: bool,
        should_succeed: bool,
    ) -> None:
        authorized_org = organization_recipe.make(name="authorized org")
        unauthorized_org = organization_recipe.make(name="unauthorized org")

        user = baker.make(
            User,
        )

        if user_is_in_authorized_org:
            authorized_org.add_user(user)

        if user_is_in_unauthorized_org:
            unauthorized_org.add_user(user)

        remove_organization_permission_group(unauthorized_org)
        self.assertEqual(user.is_outreach_authorized, should_succeed)


class HmisProfileModelTestCase(TestCase):
    def test_hmis_profile_unique_constraint(self) -> None:
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID2", agency=HmisAgencyEnum.LAHSA)
        baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.PASADENA)

        with self.assertRaises(IntegrityError):
            baker.make(HmisProfile, hmis_id="hmisID1", agency=HmisAgencyEnum.LAHSA)
