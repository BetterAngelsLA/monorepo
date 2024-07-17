from accounts.models import User
from accounts.utils import remove_organization_permission_group
from django.test import TestCase
from model_bakery import baker

from .baker_recipes import organization_recipe, permission_group_recipe


class UserModelTestCase(TestCase):
    def test_str_method(self) -> None:
        user = baker.make(User, first_name="Dale", last_name="Cooper")
        self.assertEqual(f"{user}", f"Dale Cooper ({user.id})")

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
