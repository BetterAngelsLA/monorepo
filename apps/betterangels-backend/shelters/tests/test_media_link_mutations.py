from typing import Any

from django.test import TestCase
from model_bakery import baker

from accounts.models import User
from shelters.models import MediaLink, Shelter
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase

YOUTUBE_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
OTHER_YOUTUBE_URL = "https://youtu.be/aBcDeFgHiJk"
NOT_A_YOUTUBE_URL = "https://example.com/video"

MEDIA_LINK_FIELDS = """
    id
    url
    title
    mediaType
    createdAt
    updatedAt
"""


class MediaLinkMutationTestCase(ShelterTestCase, TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.graphql_client.force_login(self.operator)


class CreateMediaLinkMutationTestCase(MediaLinkMutationTestCase):
    MUTATION = f"""
        mutation CreateMediaLink($data: CreateMediaLinkInput!) {{
            createMediaLink(data: $data) {{
                ... on MediaLinkType {{
                    {MEDIA_LINK_FIELDS}
                }}
                ... on OperationInfo {{
                    messages {{
                        kind
                        field
                        message
                    }}
                }}
            }}
        }}
    """

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"shelterId": str(self.shelter.pk), "url": YOUTUBE_URL}},
            )

        self.assertGraphQLUnauthenticated(response)
        self.assertEqual(MediaLink.objects.count(), 0)

    def test_creates_media_link(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "url": YOUTUBE_URL,
                        "title": "Walkthrough",
                        "mediaType": "YOUTUBE",
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        media_link = response["data"]["createMediaLink"]
        self.assertEqual(media_link["url"], YOUTUBE_URL)
        self.assertEqual(media_link["title"], "Walkthrough")
        self.assertEqual(media_link["mediaType"], "YOUTUBE")

        saved = MediaLink.objects.get(pk=media_link["id"])
        self.assertEqual(saved.shelter_id, self.shelter.pk)
        self.assertEqual(saved.url, YOUTUBE_URL)

    def test_title_defaults_to_blank(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"shelterId": str(self.shelter.pk), "url": YOUTUBE_URL}},
            )

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["createMediaLink"]["title"], "")

    def test_rejects_url_that_is_not_valid_for_media_type(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"shelterId": str(self.shelter.pk), "url": NOT_A_YOUTUBE_URL}},
            )

        messages = response["data"]["createMediaLink"]["messages"]
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(messages[0]["field"], "url")
        self.assertEqual(MediaLink.objects.count(), 0)

    def test_returns_error_for_nonexistent_shelter(self) -> None:
        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"shelterId": "999999", "url": YOUTUBE_URL}},
            )

        self.assertGraphQLOperationInfo(
            response, "createMediaLink", "Shelter matching ID 999999 could not be found.", kind="ERROR"
        )
        self.assertEqual(MediaLink.objects.count(), 0)

    def test_returns_error_for_unauthorized_shelter(self) -> None:
        other_shelter: Any = shelter_recipe.make()

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"shelterId": str(other_shelter.pk), "url": YOUTUBE_URL}},
            )

        self.assertGraphQLOperationInfo(
            response, "createMediaLink", f"Shelter matching ID {other_shelter.pk} could not be found.", kind="ERROR"
        )
        self.assertEqual(MediaLink.objects.count(), 0)


class UpdateMediaLinkMutationTestCase(MediaLinkMutationTestCase):
    MUTATION = f"""
        mutation UpdateMediaLink($data: UpdateMediaLinkInput!) {{
            updateMediaLink(data: $data) {{
                ... on MediaLinkType {{
                    {MEDIA_LINK_FIELDS}
                }}
                ... on OperationInfo {{
                    messages {{
                        kind
                        field
                        message
                    }}
                }}
            }}
        }}
    """

    def setUp(self) -> None:
        super().setUp()
        self.media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL, title="Old title")

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"id": str(self.media_link.pk), "url": OTHER_YOUTUBE_URL}},
            )

        self.assertGraphQLUnauthenticated(response)
        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, YOUTUBE_URL)

    def test_updates_url_and_title(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "id": str(self.media_link.pk),
                        "url": OTHER_YOUTUBE_URL,
                        "title": "New title",
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateMediaLink"]
        self.assertEqual(result["url"], OTHER_YOUTUBE_URL)
        self.assertEqual(result["title"], "New title")

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, OTHER_YOUTUBE_URL)
        self.assertEqual(self.media_link.title, "New title")

    def test_leaves_omitted_fields_untouched(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"id": str(self.media_link.pk), "title": "Only the title"}},
            )

        self.assertIsNone(response.get("errors"))

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.title, "Only the title")
        self.assertEqual(self.media_link.url, YOUTUBE_URL)

    def test_rejects_url_that_is_not_valid_for_media_type(self) -> None:
        expected_query_count = 9
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"id": str(self.media_link.pk), "url": NOT_A_YOUTUBE_URL}},
            )

        messages = response["data"]["updateMediaLink"]["messages"]
        self.assertEqual(messages[0]["kind"], "VALIDATION")
        self.assertEqual(messages[0]["field"], "url")

        self.media_link.refresh_from_db()
        self.assertEqual(self.media_link.url, YOUTUBE_URL)

    def test_returns_error_for_nonexistent_media_link(self) -> None:
        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"id": "999999", "url": OTHER_YOUTUBE_URL}},
            )

        self.assertGraphQLOperationInfo(response, "updateMediaLink", "999999", kind="ERROR")

    def test_returns_error_for_media_link_on_unauthorized_shelter(self) -> None:
        other_shelter: Any = shelter_recipe.make()
        media_link: Any = baker.make(MediaLink, shelter=other_shelter, url=YOUTUBE_URL)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {"data": {"id": str(media_link.pk), "url": OTHER_YOUTUBE_URL}},
            )

        self.assertGraphQLOperationInfo(response, "updateMediaLink", str(media_link.pk), kind="ERROR")

        media_link.refresh_from_db()
        self.assertEqual(media_link.url, YOUTUBE_URL)


class DeleteMediaLinksMutationTestCase(MediaLinkMutationTestCase):
    MUTATION = """
        mutation DeleteMediaLinks($data: BulkDeleteInput!) {
            deleteMediaLinks(data: $data) {
                ... on BulkDeleteResult {
                    ids
                }
                ... on OperationInfo {
                    messages {
                        kind
                        field
                        message
                    }
                }
            }
        }
    """

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()
        media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(media_link.pk)]}})

        self.assertGraphQLUnauthenticated(response)
        self.assertTrue(MediaLink.objects.filter(pk=media_link.pk).exists())

    def test_deletes_single_media_link(self) -> None:
        media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        other: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(media_link.pk)]}})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteMediaLinks"]["ids"], [str(media_link.pk)])
        self.assertFalse(MediaLink.objects.filter(pk=media_link.pk).exists())
        self.assertTrue(MediaLink.objects.filter(pk=other.pk).exists())

    def test_deletes_multiple_media_links(self) -> None:
        media_link_1: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        media_link_2: Any = baker.make(MediaLink, shelter=self.shelter, url=OTHER_YOUTUBE_URL)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION, {"data": {"ids": [str(media_link_1.pk), str(media_link_2.pk)]}}
            )

        self.assertIsNone(response.get("errors"))
        self.assertCountEqual(response["data"]["deleteMediaLinks"]["ids"], [str(media_link_1.pk), str(media_link_2.pk)])
        self.assertFalse(MediaLink.objects.filter(pk__in=[media_link_1.pk, media_link_2.pk]).exists())

    def test_deletes_multiple_media_links_returns_ids_in_request_order(self) -> None:
        """The response follows the request order, not the DB's row order."""
        media_link_1: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        media_link_2: Any = baker.make(MediaLink, shelter=self.shelter, url=OTHER_YOUTUBE_URL)
        requested_ids = [str(media_link_2.pk), str(media_link_1.pk)]

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": requested_ids}})

        self.assertIsNone(response.get("errors"))
        self.assertEqual(response["data"]["deleteMediaLinks"]["ids"], requested_ids)

    def test_returns_error_for_unauthorized_media_link(self) -> None:
        authorized: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)
        other_shelter: Any = shelter_recipe.make()
        unauthorized: Any = baker.make(MediaLink, shelter=other_shelter, url=YOUTUBE_URL)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION, {"data": {"ids": [str(authorized.pk), str(unauthorized.pk)]}}
            )

        self.assertGraphQLOperationInfo(response, "deleteMediaLinks", str(unauthorized.pk), kind="ERROR")
        # Atomic — nothing deleted
        self.assertTrue(MediaLink.objects.filter(pk=authorized.pk).exists())
        self.assertTrue(MediaLink.objects.filter(pk=unauthorized.pk).exists())

    def test_returns_error_for_nonexistent_id(self) -> None:
        media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(media_link.pk), "999999"]}})

        self.assertGraphQLOperationInfo(response, "deleteMediaLinks", "999999", kind="ERROR")
        # Atomic — nothing deleted
        self.assertTrue(MediaLink.objects.filter(pk=media_link.pk).exists())


class MediaLinkMutationPermissionTestCase(MediaLinkMutationTestCase):
    """Media link writes are gated on ``change_shelter`` (ADR 0001 §2.6).

    The shelter-photo pipeline uses the same gate: a scoped Shelter Operator
    Grant carries ``change_shelter``, so a read-only viewer (VIEW grant only)
    fails closed on every media link write.
    """

    CREATE_MUTATION = """
        mutation CreateMediaLink($data: CreateMediaLinkInput!) {
            createMediaLink(data: $data) {
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    UPDATE_MUTATION = """
        mutation UpdateMediaLink($data: UpdateMediaLinkInput!) {
            updateMediaLink(data: $data) {
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    DELETE_MUTATION = """
        mutation DeleteMediaLinks($data: BulkDeleteInput!) {
            deleteMediaLinks(data: $data) {
                ... on OperationInfo {
                    messages {
                        kind
                        message
                    }
                }
            }
        }
    """

    def setUp(self) -> None:
        super().setUp()
        self.viewer = baker.make(User)
        self.org.users.add(self.viewer)
        self._grant_permission(self.viewer, Shelter.perms.VIEW, self.org, role_name="Media Link View Only")
        self.graphql_client.force_login(self.viewer)

    def test_create_denied_without_change_permission(self) -> None:
        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.CREATE_MUTATION,
                {"data": {"shelterId": str(self.shelter.pk), "url": YOUTUBE_URL}},
            )

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "createMediaLink", "Shelter matching ID", kind="ERROR")
        self.assertEqual(MediaLink.objects.count(), 0)

    def test_update_denied_without_change_permission(self) -> None:
        media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.UPDATE_MUTATION,
                {"data": {"id": str(media_link.pk), "url": OTHER_YOUTUBE_URL}},
            )

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "updateMediaLink", str(media_link.pk), kind="ERROR")

        media_link.refresh_from_db()
        self.assertEqual(media_link.url, YOUTUBE_URL)

    def test_delete_denied_without_change_permission(self) -> None:
        media_link: Any = baker.make(MediaLink, shelter=self.shelter, url=YOUTUBE_URL)

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.DELETE_MUTATION, {"data": {"ids": [str(media_link.pk)]}})

        self.assertIsNone(response.get("errors"))
        self.assertGraphQLOperationInfo(response, "deleteMediaLinks", str(media_link.pk), kind="ERROR")
        self.assertTrue(MediaLink.objects.filter(pk=media_link.pk).exists())
