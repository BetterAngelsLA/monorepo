from typing import Any
from unittest.mock import MagicMock, patch

import waffle
from common.imgproxy import IMGPROXY_SWITCH
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ShelterPhotoTypeChoices
from shelters.models import ShelterPhoto
from shelters.tests.baker_recipes import shelter_recipe
from shelters.tests.utils import ShelterTestCase


class GenerateShelterPhotoUploadsMutationTest(ShelterTestCase, TestCase):
    MUTATION = """
        mutation GenerateShelterPhotoUploads($data: GenerateShelterPhotoUploadsInput!) {
            generateShelterPhotoUploads(data: $data) {
                ... on AuthorizedPresignedS3UploadsType {
                    uploads {
                        refId
                        url
                        fields
                        presignedKey
                        uploadToken
                    }
                }
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
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.graphql_client.force_login(self.operator)

    @patch("shelters.schema.shelter_photo.create_presigned_uploads")
    def test_returns_presigned_upload_data(self, mock_create: MagicMock) -> None:
        mock_create.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz"},
                    "presigned_key": "media/shelters/abc.jpg",
                    "upload_token": "token-abc",
                }
            ]
        }

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "uploads": [{"refId": "ref-1", "filename": "photo.jpg", "contentType": "image/jpeg"}],
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        uploads = response["data"]["generateShelterPhotoUploads"]["uploads"]
        self.assertEqual(len(uploads), 1)
        self.assertEqual(uploads[0]["refId"], "ref-1")
        self.assertEqual(uploads[0]["url"], "https://s3.example.com/upload")
        self.assertEqual(uploads[0]["presignedKey"], "media/shelters/abc.jpg")
        self.assertEqual(uploads[0]["uploadToken"], "token-abc")

    @patch("shelters.schema.shelter_photo.create_presigned_uploads")
    def test_returns_presigned_upload_data_for_multiple_uploads(self, mock_create: MagicMock) -> None:
        mock_create.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "url": "https://s3.example.com/upload-1",
                    "fields": {"Policy": "abc"},
                    "presigned_key": "media/shelters/a.jpg",
                    "upload_token": "token-1",
                },
                {
                    "ref_id": "ref-2",
                    "url": "https://s3.example.com/upload-2",
                    "fields": {"Policy": "def"},
                    "presigned_key": "media/shelters/b.jpg",
                    "upload_token": "token-2",
                },
            ]
        }

        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "uploads": [
                            {"refId": "ref-1", "filename": "a.jpg", "contentType": "image/jpeg"},
                            {"refId": "ref-2", "filename": "b.jpg", "contentType": "image/jpeg"},
                        ],
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        uploads = response["data"]["generateShelterPhotoUploads"]["uploads"]
        self.assertEqual(len(uploads), 2)
        self.assertEqual(uploads[0]["refId"], "ref-1")
        self.assertEqual(uploads[0]["presignedKey"], "media/shelters/a.jpg")
        self.assertEqual(uploads[1]["refId"], "ref-2")
        self.assertEqual(uploads[1]["presignedKey"], "media/shelters/b.jpg")

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "uploads": [{"refId": "ref-1", "filename": "photo.jpg", "contentType": "image/jpeg"}],
                    }
                },
            )

        self.assertGraphQLUnauthenticated(response)

    def test_returns_operation_info_for_nonexistent_shelter(self) -> None:
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": "999999",
                        "uploads": [{"refId": "ref-1", "filename": "photo.jpg", "contentType": "image/jpeg"}],
                    }
                },
            )

        self.assertGraphQLOperationInfo(
            response, "generateShelterPhotoUploads", "Shelter matching ID 999999 could not be found.", kind="ERROR"
        )

    def test_returns_operation_info_for_unauthorized_shelter(self) -> None:
        other_shelter: Any = shelter_recipe.make()

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(other_shelter.pk),
                        "uploads": [{"refId": "ref-1", "filename": "photo.jpg", "contentType": "image/jpeg"}],
                    }
                },
            )

        self.assertGraphQLOperationInfo(
            response,
            "generateShelterPhotoUploads",
            f"Shelter matching ID {other_shelter.pk} could not be found.",
            kind="ERROR",
        )


class ResolveShelterPhotoUploadsMutationTest(ShelterTestCase, TestCase):
    MUTATION = """
        mutation ResolveShelterPhotoUploads($data: ResolveShelterPhotoUploadsInput!) {
            resolveShelterPhotoUploads(data: $data) {
                ... on ShelterPhotoUploadsType {
                    photos {
                        id
                        type
                        file {
                            name
                            url
                        }
                    }
                }
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
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.graphql_client.force_login(self.operator)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_creates_single_shelter_photo_and_returns_it(
        self, mock_validate: MagicMock
    ) -> None:
        mock_validate.return_value = [
            MagicMock(
                presigned_key="media/shelters/abc.jpg",
                file_path="shelters/abc.jpg",
            )
        ]
        initial_count = ShelterPhoto.objects.count()

        expected_query_count = 6
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "valid-token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        photos = response["data"]["resolveShelterPhotoUploads"]["photos"]
        self.assertEqual(len(photos), 1)
        self.assertEqual(photos[0]["type"], "INTERIOR")
        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 1)

        # Verify the database record has the correct file path and type
        photo = ShelterPhoto.objects.get(shelter=self.shelter)
        self.assertIn("shelters/abc.jpg", photo.file.name)
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_creates_multiple_shelter_photos_and_returns_them(
        self, mock_validate: MagicMock
    ) -> None:
        mock_validate.return_value = [
            MagicMock(file_path="shelters/a.jpg"),
            MagicMock(file_path="shelters/b.jpg"),
        ]
        initial_count = ShelterPhoto.objects.count()

        # Warm waffle cache so is_imgproxy_enabled() doesn't add a flaky extra query
        waffle.switch_is_active(IMGPROXY_SWITCH)

        expected_query_count = 7
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/a.jpg",
                                "uploadToken": "valid-token",
                                "filename": "a.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            },
                            {
                                "presignedKey": "media/shelters/b.jpg",
                                "uploadToken": "valid-token",
                                "filename": "b.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "EXTERIOR",
                            },
                        ],
                    }
                },
            )

        self.assertIsNone(response.get("errors"))
        photos = response["data"]["resolveShelterPhotoUploads"]["photos"]
        self.assertEqual(len(photos), 2)
        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 2)

        # Verify the database records have the correct file paths and types
        db_photos = ShelterPhoto.objects.filter(shelter=self.shelter).order_by("file")
        self.assertIn("shelters/a.jpg", db_photos[0].file.name)
        self.assertEqual(db_photos[0].type, ShelterPhotoTypeChoices.INTERIOR)
        self.assertIn("shelters/b.jpg", db_photos[1].file.name)
        self.assertEqual(db_photos[1].type, ShelterPhotoTypeChoices.EXTERIOR)

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertGraphQLUnauthenticated(response)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_returns_error_on_invalid_token(self, mock_validate: MagicMock) -> None:
        mock_validate.side_effect = ValueError("Invalid or expired upload token for 'photo.jpg'")
        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "bad-token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertGraphQLError(response, "Invalid or expired upload token for 'photo.jpg'")
        self.assertEqual(ShelterPhoto.objects.filter(shelter=self.shelter).count(), 0)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_returns_error_when_file_not_in_s3(self, mock_validate: MagicMock) -> None:
        mock_validate.side_effect = ValueError("File not found in storage for 'photo.jpg'")
        expected_query_count = 2
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(self.shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "valid-token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertGraphQLError(response, "File not found in storage for 'photo.jpg'")
        self.assertEqual(ShelterPhoto.objects.filter(shelter=self.shelter).count(), 0)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_returns_operation_info_for_nonexistent_shelter(
        self, mock_validate: MagicMock
    ) -> None:
        mock_validate.return_value = []
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": "999999",
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "valid-token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertGraphQLOperationInfo(
            response, "resolveShelterPhotoUploads", "Shelter matching ID 999999 could not be found.", kind="ERROR"
        )
        self.assertEqual(ShelterPhoto.objects.filter(shelter=self.shelter).count(), 0)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_returns_operation_info_for_unauthorized_shelter(
        self, mock_validate: MagicMock
    ) -> None:
        mock_validate.return_value = []
        # Shelter belonging to a different org — the filtered Shelter.objects.get
        # raises DoesNotExist, which Strawberry wraps in the response.
        other_shelter: Any = shelter_recipe.make()

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION,
                {
                    "data": {
                        "shelterId": str(other_shelter.pk),
                        "photos": [
                            {
                                "presignedKey": "media/shelters/abc.jpg",
                                "uploadToken": "valid-token",
                                "filename": "photo.jpg",
                                "contentType": "image/jpeg",
                                "photoType": "INTERIOR",
                            }
                        ],
                    }
                },
            )

        self.assertGraphQLOperationInfo(
            response,
            "resolveShelterPhotoUploads",
            f"Shelter matching ID {other_shelter.pk} could not be found.",
            kind="ERROR",
        )
        self.assertEqual(ShelterPhoto.objects.count(), 0)


class DeleteShelterPhotosMutationTest(ShelterTestCase, TestCase):
    MUTATION = """
        mutation DeleteShelterPhotos($data: BulkDeleteInput!) {
            deleteShelterPhotos(data: $data) {
                ... on BulkDeleteResult {
                    ids
                }
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
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.graphql_client.force_login(self.operator)

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()
        photo = baker.make(ShelterPhoto, shelter=self.shelter)

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(photo.pk)]}})

        self.assertGraphQLUnauthenticated(response)
        self.assertTrue(ShelterPhoto.objects.filter(pk=photo.pk).exists())

    def test_deletes_single_photo(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter)
        other = baker.make(ShelterPhoto, shelter=self.shelter)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(photo.pk)]}})

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteShelterPhotos"]["ids"]
        self.assertEqual(deleted_ids, [str(photo.pk)])
        self.assertFalse(ShelterPhoto.objects.filter(pk=photo.pk).exists())
        self.assertTrue(ShelterPhoto.objects.filter(pk=other.pk).exists())

    def test_deletes_multiple_photos(self) -> None:
        photo1 = baker.make(ShelterPhoto, shelter=self.shelter)
        photo2 = baker.make(ShelterPhoto, shelter=self.shelter)
        other = baker.make(ShelterPhoto, shelter=self.shelter)

        expected_query_count = 8
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(photo1.pk), str(photo2.pk)]}})

        self.assertIsNone(response.get("errors"))
        deleted_ids = response["data"]["deleteShelterPhotos"]["ids"]
        self.assertCountEqual(deleted_ids, [str(photo1.pk), str(photo2.pk)])
        self.assertFalse(ShelterPhoto.objects.filter(pk__in=[photo1.pk, photo2.pk]).exists())
        self.assertTrue(ShelterPhoto.objects.filter(pk=other.pk).exists())

    def test_returns_operation_info_for_unauthorized_photo(self) -> None:
        authorized = baker.make(ShelterPhoto, shelter=self.shelter)
        other_shelter: Any = shelter_recipe.make()
        unauthorized = baker.make(ShelterPhoto, shelter=other_shelter)

        expected_query_count = 6
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(
                self.MUTATION, {"data": {"ids": [str(authorized.pk), str(unauthorized.pk)]}}
            )

        self.assertGraphQLOperationInfo(response, "deleteShelterPhotos", str(unauthorized.pk), kind="ERROR")
        # Atomic — nothing deleted
        self.assertTrue(ShelterPhoto.objects.filter(pk=authorized.pk).exists())
        self.assertTrue(ShelterPhoto.objects.filter(pk=unauthorized.pk).exists())

    def test_returns_operation_info_for_nonexistent_id(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter)

        expected_query_count = 6
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"ids": [str(photo.pk), "999999"]}})

        self.assertGraphQLOperationInfo(response, "deleteShelterPhotos", "999999", kind="ERROR")
        # Atomic — nothing deleted
        self.assertTrue(ShelterPhoto.objects.filter(pk=photo.pk).exists())


class UpdateShelterPhotoMutationTest(ShelterTestCase, TestCase):
    MUTATION = """
        mutation UpdateShelterPhoto($data: UpdateShelterPhotoInput!) {
            updateShelterPhoto(data: $data) {
                ... on ShelterPhotoType {
                    id
                    type
                }
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
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.graphql_client.force_login(self.operator)

    def test_requires_authentication(self) -> None:
        self.graphql_client.logout()
        photo = baker.make(ShelterPhoto, shelter=self.shelter, type=ShelterPhotoTypeChoices.INTERIOR)

        expected_query_count = 0
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"id": str(photo.pk), "photoType": "EXTERIOR"}})

        self.assertGraphQLUnauthenticated(response)
        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)

    def test_updates_photo_type(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter, type=ShelterPhotoTypeChoices.INTERIOR)

        expected_query_count = 4
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"id": str(photo.pk), "photoType": "EXTERIOR"}})

        self.assertIsNone(response.get("errors"))
        result = response["data"]["updateShelterPhoto"]
        self.assertEqual(result["id"], str(photo.pk))
        self.assertEqual(result["type"], "EXTERIOR")
        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.EXTERIOR)

    def test_returns_operation_info_for_nonexistent_photo(self) -> None:
        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"id": "999999", "photoType": "EXTERIOR"}})

        self.assertGraphQLOperationInfo(response, "updateShelterPhoto", "999999", kind="ERROR")

    def test_returns_operation_info_for_unauthorized_photo(self) -> None:
        other_shelter: Any = shelter_recipe.make()
        photo = baker.make(ShelterPhoto, shelter=other_shelter, type=ShelterPhotoTypeChoices.INTERIOR)

        expected_query_count = 3
        with self.assertNumQueriesWithoutCache(expected_query_count):
            response = self.execute_graphql(self.MUTATION, {"data": {"id": str(photo.pk), "photoType": "EXTERIOR"}})

        self.assertGraphQLOperationInfo(response, "updateShelterPhoto", str(photo.pk), kind="ERROR")
        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)
