"""Unit tests for client merge selectors — no GraphQL, no HTTP.

Tests ``clients.selectors.merge`` functions directly.
"""

from django.test import TestCase
from model_bakery import baker

from clients.models import ClientProfile
from clients.selectors.merge import (
    MergeProfilesNotFoundError,
    get_merge_profiles,
    get_merged_sources,
    get_profile_by_id,
    get_profiles_by_ids,
)


class GetProfilesTestCase(TestCase):
    """Test get_profiles_by_ids and get_profile_by_id."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.profile_1 = baker.make(ClientProfile, first_name="Alice")
        cls.profile_2 = baker.make(ClientProfile, first_name="Bob")

    def test_get_profiles_by_ids_returns_correct(self) -> None:
        result = get_profiles_by_ids([self.profile_1.pk, self.profile_2.pk])
        self.assertEqual(len(result), 2)
        self.assertIn(self.profile_1, result)
        self.assertIn(self.profile_2, result)

    def test_get_profiles_by_ids_ordered_by_pk(self) -> None:
        result = get_profiles_by_ids([self.profile_2.pk, self.profile_1.pk])
        self.assertEqual(result[0].pk, self.profile_1.pk)  # ordered by pk
        self.assertEqual(result[1].pk, self.profile_2.pk)

    def test_get_profiles_by_ids_empty_list(self) -> None:
        result = get_profiles_by_ids([])
        self.assertEqual(result, [])

    def test_get_profiles_by_ids_nonexistent(self) -> None:
        result = get_profiles_by_ids([99999])
        self.assertEqual(result, [])

    def test_get_profile_by_id_found(self) -> None:
        result = get_profile_by_id(self.profile_1.pk)
        self.assertEqual(result, self.profile_1)

    def test_get_profile_by_id_not_found(self) -> None:
        result = get_profile_by_id(99999)
        self.assertIsNone(result)


class MergeSelectorsTestCase(TestCase):
    """Test get_merged_sources and get_merge_profiles."""

    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        cls.target = baker.make(ClientProfile, first_name="Target")
        cls.source_a = baker.make(ClientProfile, first_name="Source A")
        cls.source_b = baker.make(ClientProfile, first_name="Source B", merged_into=cls.target)

    def test_get_merged_sources_returns_merged(self) -> None:
        result = get_merged_sources(self.target.pk)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].pk, self.source_b.pk)

    def test_get_merged_sources_empty_when_none(self) -> None:
        result = get_merged_sources(self.source_a.pk)  # not merged into
        self.assertEqual(result, [])

    def test_get_merge_profiles_success(self) -> None:
        target, sources = get_merge_profiles(
            source_ids=[self.source_a.pk], target_id=self.target.pk
        )
        self.assertEqual(target.pk, self.target.pk)
        self.assertEqual(len(sources), 1)
        self.assertEqual(sources[0].pk, self.source_a.pk)

    def test_get_merge_profiles_target_not_found(self) -> None:
        with self.assertRaises(MergeProfilesNotFoundError):
            get_merge_profiles(source_ids=[self.source_a.pk], target_id=99999)

    def test_get_merge_profiles_source_not_found(self) -> None:
        with self.assertRaises(MergeProfilesNotFoundError):
            get_merge_profiles(source_ids=[99999], target_id=self.target.pk)
