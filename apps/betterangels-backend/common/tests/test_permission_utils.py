from typing import List

from accounts.models import User
from common.models import SimpleModel
from common.permissions.enums import SimpleModelPermissions
from common.permissions.utils import get_objects_for_user
from django.contrib.auth.models import AnonymousUser, Group
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from unittest_parametrize import ParametrizedTestCase, parametrize


class PermissionUtilsTests(ParametrizedTestCase, TestCase):
    user_with_perms: User
    user_with_all_perms: User
    user_without_perms: User
    user_with_group_perms: User
    user_with_group_all_perms: User
    anonymous_user: AnonymousUser
    test_group: Group
    test_group_with_all_perms: Group
    obj1: SimpleModel
    obj2: SimpleModel
    obj3: SimpleModel
    obj4: SimpleModel

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        # Create test users
        cls.user_with_perms = baker.make(User)
        cls.user_with_all_perms = baker.make(User)
        cls.user_without_perms = baker.make(User)
        cls.user_with_group_all_perms = baker.make(User)
        cls.user_with_group_perms = baker.make(User)
        cls.anonymous_user = AnonymousUser()

        # Create a test group and add user_with_group_perms to it
        cls.test_group = baker.make(Group)
        cls.user_with_group_perms.groups.add(cls.test_group)
        cls.test_group_with_all_perms = baker.make(Group)
        cls.user_with_group_all_perms.groups.add(cls.test_group_with_all_perms)

        # Create test objects
        cls.obj1 = baker.make(SimpleModel)
        cls.obj2 = baker.make(SimpleModel)
        cls.obj3 = baker.make(SimpleModel)
        cls.obj4 = baker.make(SimpleModel)

        # Assign permissions directly to user_with_perms
        assign_perm(SimpleModelPermissions.VIEW, cls.user_with_perms, cls.obj1)
        assign_perm(SimpleModelPermissions.VIEW, cls.user_with_perms, cls.obj2)

        assign_perm(SimpleModelPermissions.VIEW, cls.user_with_all_perms, cls.obj1)
        assign_perm(SimpleModelPermissions.CHANGE, cls.user_with_all_perms, cls.obj1)

        # Assign permissions to the group
        assign_perm(SimpleModelPermissions.VIEW, cls.test_group, cls.obj1)
        assign_perm(SimpleModelPermissions.VIEW, cls.test_group, cls.obj3)

        # Assign both VIEW and CHANGE permissions to the group for a specific obj
        assign_perm(
            SimpleModelPermissions.VIEW,
            cls.test_group_with_all_perms,
            cls.obj4,
        )
        assign_perm(
            SimpleModelPermissions.CHANGE,
            cls.test_group_with_all_perms,
            cls.obj4,
        )

    @parametrize(
        "user_attr,permissions,any_perm,expected_count,expected_query_count",
        [
            # Testing direct permissions
            (
                "user_with_perms",
                [SimpleModelPermissions.VIEW],
                True,
                2,
                1,
            ),  # Access to obj1, obj2
            (
                "user_with_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                True,
                2,
                1,
            ),  # Same, assuming SimpleModelPermissions.CHANGE not required for access
            (
                "user_with_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                False,
                0,
                1,
            ),  # Fails because SimpleModelPermissions.CHANGE permission is missing
            (
                "user_with_all_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                False,
                1,  # Assuming the user has both permissions on 1 obj
                1,
            ),
            # Testing group permissions
            (
                "user_with_group_perms",
                [SimpleModelPermissions.VIEW],
                True,
                2,
                1,
            ),  # Access to obj1 and obj3 via group
            (
                "user_with_group_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                True,
                2,
                1,
            ),  # Assuming SimpleModelPermissions.CHANGE not required for access
            (
                "user_with_group_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                False,
                0,
                1,
            ),  # Fails because SimpleModelPermissions.CHANGE permission is missing
            (
                "user_with_group_all_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                False,
                1,
                1,
            ),  # Assuming the group has both permissions on 1 obj
            # User without any permissions
            ("user_without_perms", [SimpleModelPermissions.VIEW], True, 0, 1),
            (
                "user_without_perms",
                [SimpleModelPermissions.VIEW, SimpleModelPermissions.CHANGE],
                False,
                0,
                1,
            ),
            # Anonymous user
            (
                "anonymous_user",
                [SimpleModelPermissions.VIEW],
                True,
                0,
                0,
            ),  # No DB queries expected for anonymous users without any permissions
            # Additional scenarios
            (
                "user_with_perms",
                [],
                True,
                0,
                0,
            ),  # No permissions specified, expects no access
            (
                "user_with_group_perms",
                [],
                True,
                0,
                0,
            ),  # No permissions specified for group, expects no access
        ],
    )
    def test_permission_checks(
        self,
        user_attr: str,
        permissions: List[str],
        any_perm: bool,
        expected_count: int,
        expected_query_count: int,
    ) -> None:
        user = getattr(self, user_attr)
        with self.assertNumQueries(expected_query_count):
            queryset = get_objects_for_user(
                user, permissions, SimpleModel.objects.all(), any_perm=any_perm
            )
            self.assertEqual(queryset.count(), expected_count)
