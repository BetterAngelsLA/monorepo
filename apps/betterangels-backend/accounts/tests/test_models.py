from accounts.models import User
from accounts.utils import remove_organization_permission_group
from django.test import TestCase
from model_bakery import baker

from .baker_recipes import organization_recipe, permission_group_recipe


class UserModelTest(TestCase):
    def test_full_name(self) -> None:
        user = baker.make(User, first_name="Dale", last_name="Cooper")
        self.assertEqual(user.full_name, "Dale Cooper")

    def test_is_outreach_authorized(self) -> None:
        authorized_org = organization_recipe.make(name="authorized org")
        unauthorized_org = organization_recipe.make(name="unauthorized org")

        (
            authorized_user_1,
            authorized_user_2,
            unauthorized_user_1,
            unauthorized_user_2,
        ) = baker.make(User, _quantity=4)

        authorized_org.add_user(authorized_user_1)
        authorized_org.add_user(authorized_user_2)
        unauthorized_org.add_user(unauthorized_user_1)
        unauthorized_org.add_user(authorized_user_2)

        remove_organization_permission_group(unauthorized_org)

        permission_group_recipe.make(
            name="unauthorized permission group",
            organization=unauthorized_org,
        )

        self.assertTrue(authorized_user_1.is_outreach_authorized)
        self.assertTrue(authorized_user_2.is_outreach_authorized)
        self.assertFalse(unauthorized_user_1.is_outreach_authorized)
        self.assertFalse(unauthorized_user_2.is_outreach_authorized)
