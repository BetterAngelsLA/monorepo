from typing import List

from accounts.models import User
from common.permissions.utils import get_objects_for_user
from django.contrib.auth.models import AnonymousUser, Group
from django.test import TestCase
from guardian.shortcuts import assign_perm
from model_bakery import baker
from notes.models import Note
from unittest_parametrize import ParametrizedTestCase, parametrize


class PermissionUtilsTests(ParametrizedTestCase, TestCase):
    user_with_perms: User
    user_without_perms: User
    user_with_group_perms: User
    anonymous_user: AnonymousUser
    test_group: Group
    note1: Note
    note2: Note
    note3: Note  # Additional note for group permission testing

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        # Create test users
        cls.user_with_perms = baker.make(User)
        cls.user_without_perms = baker.make(User)
        cls.user_with_group_perms = baker.make(User)
        cls.anonymous_user = AnonymousUser()

        # Create a test group and add user_with_group_perms to it
        cls.test_group = baker.make(Group)
        cls.user_with_group_perms.groups.add(cls.test_group)

        # Create test notes
        cls.note1 = baker.make(Note)
        cls.note2 = baker.make(Note)
        cls.note3 = baker.make(Note)

        # Assign permissions directly to user_with_perms
        assign_perm("view_note", cls.user_with_perms, cls.note1)
        assign_perm("view_note", cls.user_with_perms, cls.note2)

        # Assign permissions to the group
        assign_perm("view_note", cls.test_group, cls.note1)
        assign_perm("view_note", cls.test_group, cls.note3)

    @parametrize(
        "user_attr,permissions,any_perm,expected_count,expected_queries",
        [
            # Testing direct permissions
            (
                "user_with_perms",
                ["view_note"],
                True,
                2,
                1,
            ),  # Access to note1, note2
            (
                "user_with_perms",
                ["view_note", "edit_note"],
                True,
                2,
                1,
            ),  # Same, assuming "edit_note" not required for access
            (
                "user_with_perms",
                ["view_note", "edit_note"],
                False,
                0,
                1,
            ),  # Fails because "edit_note" permission is missing
            # Testing group permissions
            (
                "user_with_group_perms",
                ["view_note"],
                True,
                2,
                1,
            ),  # Access to note1 and note3 via group
            (
                "user_with_group_perms",
                ["view_note", "edit_note"],
                True,
                2,
                1,
            ),  # Assuming "edit_note" not required for access
            (
                "user_with_group_perms",
                ["view_note", "edit_note"],
                False,
                0,
                1,
            ),  # Fails because "edit_note" permission is missing
            # User without any permissions
            ("user_without_perms", ["view_note"], True, 0, 1),
            ("user_without_perms", ["view_note", "edit_note"], False, 0, 1),
            # Anonymous user
            (
                "anonymous_user",
                ["view_note"],
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
        expected_queries: int,
    ) -> None:
        user = getattr(self, user_attr)
        with self.assertNumQueries(expected_queries):
            queryset = get_objects_for_user(
                user, permissions, Note.objects.all(), any_perm=any_perm
            )
            self.assertEqual(queryset.count(), expected_count)
