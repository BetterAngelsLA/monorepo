from typing import Any
from unittest.mock import MagicMock, patch

from accounts.tests.baker_recipes import organization_recipe
from django.core.exceptions import ObjectDoesNotExist
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ShelterPhotoTypeChoices
from shelters.models import ShelterPhoto
from shelters.services.shelter_photo import (
    SHELTER_PHOTO_CONFIG,
    ShelterPhotoResolveItem,
    create_presigned_uploads,
    delete_shelter_photos,
    resolve_uploads,
    update_shelter_photo,
)
from shelters.tests.baker_recipes import shelter_recipe
from common.services.attachment_upload import GenerateUploadItem
from shelters.types.inputs import UpdateShelterPhotoInput
from strawberry import ID

# ---------------------------------------------------------------------------
# Content type validation (tests ALLOWED_CONTENT_TYPES constant)
# ---------------------------------------------------------------------------


class ValidateContentTypeTest(TestCase):
    def test_allows_all_default_image_content_types(self) -> None:
        for ct in SHELTER_PHOTO_CONFIG.allowed_content_types:
            with self.subTest(content_type=ct):
                self.assertIn(ct, SHELTER_PHOTO_CONFIG.allowed_content_types)

    def test_pdf_not_in_allowlist(self) -> None:
        self.assertNotIn("application/pdf", SHELTER_PHOTO_CONFIG.allowed_content_types)

    def test_empty_string_not_in_allowlist(self) -> None:
        self.assertNotIn("", SHELTER_PHOTO_CONFIG.allowed_content_types)


# ---------------------------------------------------------------------------
# create_presigned_uploads
# ---------------------------------------------------------------------------


class CreatePresignedUploadsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.org: Any = organization_recipe.make()
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.org.users.add(self.user)

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_delegates_to_generic_with_shelter_photo_config(self, mock_generic: MagicMock) -> None:
        uploads = [GenerateUploadItem(ref_id="ref-1", filename="photo.jpg", content_type="image/jpeg")]
        mock_generic.return_value = {"uploads": []}

        create_presigned_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=str(self.shelter.pk),
            uploads=uploads,
        )

        mock_generic.assert_called_once_with(
            user=self.user,
            uploads=uploads,
            config=SHELTER_PHOTO_CONFIG,
        )

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_returns_batch_from_generic(self, mock_generic: MagicMock) -> None:
        expected = {
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
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=str(self.shelter.pk),
            uploads=[GenerateUploadItem(ref_id="ref-1", filename="photo.jpg", content_type="image/jpeg")],
        )

        self.assertEqual(result, expected)

    @patch("common.services.attachment_upload.create_presigned_uploads")
    def test_handles_multiple_uploads(self, mock_generic: MagicMock) -> None:
        expected = {
            "uploads": [
                {"ref_id": "ref-1", "url": "u1", "fields": {}, "presigned_key": "k1", "upload_token": "t1"},
                {"ref_id": "ref-2", "url": "u2", "fields": {}, "presigned_key": "k2", "upload_token": "t2"},
            ]
        }
        mock_generic.return_value = expected

        result = create_presigned_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=str(self.shelter.pk),
            uploads=[
                GenerateUploadItem(ref_id="ref-1", filename="a.jpg", content_type="image/jpeg"),
                GenerateUploadItem(ref_id="ref-2", filename="b.jpg", content_type="image/jpeg"),
            ],
        )

        self.assertEqual(len(result["uploads"]), 2)


# ---------------------------------------------------------------------------
# resolve_uploads
# ---------------------------------------------------------------------------


class ResolveUploadsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.org: Any = organization_recipe.make()
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.org.users.add(self.user)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_creates_shelter_photo_record(self, mock_validate: MagicMock) -> None:
        mock_validate.return_value = [
            MagicMock(
                presigned_key="media/shelters/42/abc.jpg",
                file_path="shelters/42/abc.jpg",
            )
        ]

        initial_count = ShelterPhoto.objects.count()

        result = resolve_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=self.shelter.pk,
            photos=[
                ShelterPhotoResolveItem(
                    presigned_key="media/shelters/42/abc.jpg",
                    upload_token="valid-token",
                    filename="photo.jpg",
                    content_type="image/jpeg",
                    photo_type=ShelterPhotoTypeChoices.INTERIOR,
                )
            ],
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 1)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_saves_correct_file_path_and_type(self, mock_validate: MagicMock) -> None:
        mock_validate.return_value = [
            MagicMock(file_path="shelters/42/abc.jpg")
        ]

        result = resolve_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=self.shelter.pk,
            photos=[
                ShelterPhotoResolveItem(
                    presigned_key="media/shelters/42/abc.jpg",
                    upload_token="t",
                    filename="photo.jpg",
                    content_type="image/jpeg",
                    photo_type=ShelterPhotoTypeChoices.INTERIOR,
                )
            ],
        )

        photo = result[0]
        photo.refresh_from_db()
        self.assertEqual(photo.file.name, "shelters/42/abc.jpg")
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_associates_photo_with_shelter(self, mock_validate: MagicMock) -> None:
        mock_validate.return_value = [
            MagicMock(file_path="shelters/42/abc.jpg")
        ]

        result = resolve_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=self.shelter.pk,
            photos=[
                ShelterPhotoResolveItem(
                    presigned_key="media/shelters/42/abc.jpg",
                    upload_token="t",
                    filename="photo.jpg",
                    content_type="image/jpeg",
                    photo_type=ShelterPhotoTypeChoices.INTERIOR,
                )
            ],
        )

        self.assertEqual(result[0].shelter_id, self.shelter.pk)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_handles_multiple_photos(self, mock_validate: MagicMock) -> None:
        mock_validate.return_value = [
            MagicMock(file_path="shelters/42/a.jpg"),
            MagicMock(file_path="shelters/42/b.jpg"),
        ]

        initial_count = ShelterPhoto.objects.count()

        resolve_uploads(
            user=self.user,
            organization_id=str(self.org.pk),
            shelter_id=self.shelter.pk,
            photos=[
                ShelterPhotoResolveItem(
                    presigned_key="media/shelters/42/a.jpg",
                    upload_token="t",
                    filename="a.jpg",
                    content_type="image/jpeg",
                    photo_type=ShelterPhotoTypeChoices.INTERIOR,
                ),
                ShelterPhotoResolveItem(
                    presigned_key="media/shelters/42/b.jpg",
                    upload_token="t",
                    filename="b.jpg",
                    content_type="image/jpeg",
                    photo_type=ShelterPhotoTypeChoices.EXTERIOR,
                ),
            ],
        )

        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 2)

    @patch("shelters.services.shelter_photo.validate_upload_batch")
    def test_raises_on_validation_failure(self, mock_validate: MagicMock) -> None:
        mock_validate.side_effect = ValueError("Invalid or expired upload signature for 'bad.jpg'")

        with self.assertRaisesRegex(ValueError, "Invalid or expired upload signature for 'bad.jpg'"):
            resolve_uploads(
                user=self.user,
                organization_id=str(self.org.pk),
                shelter_id=self.shelter.pk,
                photos=[
                    ShelterPhotoResolveItem(
                        presigned_key="media/shelters/42/bad.jpg",
                        upload_token="bad",
                        filename="bad.jpg",
                        content_type="image/jpeg",
                        photo_type=ShelterPhotoTypeChoices.INTERIOR,
                    )
                ],
            )


# ---------------------------------------------------------------------------
# delete_shelter_photos
# ---------------------------------------------------------------------------


class DeleteShelterPhotosTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.org: Any = organization_recipe.make()
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.org.users.add(self.user)

    def test_deletes_single_photo(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter)
        other = baker.make(ShelterPhoto, shelter=self.shelter)

        result = delete_shelter_photos(user=self.user, organization_id=str(self.org.pk), ids=[photo.pk])

        self.assertEqual(result, [photo.pk])
        self.assertFalse(ShelterPhoto.objects.filter(pk=photo.pk).exists())
        self.assertTrue(ShelterPhoto.objects.filter(pk=other.pk).exists())

    def test_deletes_multiple_photos(self) -> None:
        photo1 = baker.make(ShelterPhoto, shelter=self.shelter)
        photo2 = baker.make(ShelterPhoto, shelter=self.shelter)
        other = baker.make(ShelterPhoto, shelter=self.shelter)

        result = delete_shelter_photos(user=self.user, organization_id=str(self.org.pk), ids=[photo1.pk, photo2.pk])

        self.assertCountEqual(result, [photo1.pk, photo2.pk])
        self.assertFalse(ShelterPhoto.objects.filter(pk__in=[photo1.pk, photo2.pk]).exists())
        self.assertTrue(ShelterPhoto.objects.filter(pk=other.pk).exists())

    def test_raises_for_nonexistent_id(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter)

        with self.assertRaisesRegex(Exception, "999999"):
            delete_shelter_photos(user=self.user, organization_id=str(self.org.pk), ids=[photo.pk, 999999])

    def test_raises_for_unauthorized_photo(self) -> None:
        other_org: Any = organization_recipe.make()
        other_shelter: Any = shelter_recipe.make(organization=other_org)
        authorized = baker.make(ShelterPhoto, shelter=self.shelter)
        unauthorized = baker.make(ShelterPhoto, shelter=other_shelter)

        with self.assertRaisesRegex(Exception, str(unauthorized.pk)):
            delete_shelter_photos(
                user=self.user,
                organization_id=str(self.org.pk),
                ids=[authorized.pk, unauthorized.pk],
            )

    def test_is_atomic_no_deletes_when_one_id_missing(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter)
        initial_count = ShelterPhoto.objects.count()

        with self.assertRaisesRegex(ObjectDoesNotExist, "999999"):
            delete_shelter_photos(user=self.user, organization_id=str(self.org.pk), ids=[photo.pk, 999999])

        self.assertEqual(ShelterPhoto.objects.count(), initial_count)

    def test_is_atomic_no_deletes_when_one_id_unauthorized(self) -> None:
        other_org: Any = organization_recipe.make()
        other_shelter: Any = shelter_recipe.make(organization=other_org)
        authorized = baker.make(ShelterPhoto, shelter=self.shelter)
        unauthorized = baker.make(ShelterPhoto, shelter=other_shelter)
        initial_count = ShelterPhoto.objects.count()

        with self.assertRaisesRegex(ObjectDoesNotExist, str(unauthorized.pk)):
            delete_shelter_photos(
                user=self.user,
                organization_id=str(self.org.pk),
                ids=[authorized.pk, unauthorized.pk],
            )

        self.assertEqual(ShelterPhoto.objects.count(), initial_count)


# ---------------------------------------------------------------------------
# update_shelter_photo
# ---------------------------------------------------------------------------


class UpdateShelterPhotoTest(TestCase):
    def setUp(self) -> None:
        self.org: Any = organization_recipe.make()
        self.user: Any = baker.make("accounts.User")
        self.user.organizations_organization.add(self.org)
        self.shelter: Any = shelter_recipe.make(organization=self.org)

    def _input(self, photo_id: int, photo_type: ShelterPhotoTypeChoices) -> UpdateShelterPhotoInput:
        return UpdateShelterPhotoInput(id=ID(str(photo_id)), photo_type=photo_type)

    def test_updates_photo_type(self) -> None:
        photo = baker.make(ShelterPhoto, shelter=self.shelter, type=ShelterPhotoTypeChoices.INTERIOR)

        result = update_shelter_photo(
            user=self.user,
            organization_id=str(self.org.pk),
            data=self._input(photo.pk, ShelterPhotoTypeChoices.EXTERIOR),
        )

        self.assertEqual(result.pk, photo.pk)
        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.EXTERIOR)

    def test_raises_for_nonexistent_photo(self) -> None:
        with self.assertRaisesRegex(Exception, "999999"):
            update_shelter_photo(
                user=self.user,
                organization_id=str(self.org.pk),
                data=self._input(999999, ShelterPhotoTypeChoices.EXTERIOR),
            )

    def test_raises_for_unauthorized_photo(self) -> None:
        other_org: Any = organization_recipe.make()
        other_shelter: Any = shelter_recipe.make(organization=other_org)
        photo = baker.make(ShelterPhoto, shelter=other_shelter, type=ShelterPhotoTypeChoices.INTERIOR)

        with self.assertRaisesRegex(Exception, str(photo.pk)):
            update_shelter_photo(
                user=self.user,
                organization_id=str(self.org.pk),
                data=self._input(photo.pk, ShelterPhotoTypeChoices.EXTERIOR),
            )

        photo.refresh_from_db()
        self.assertEqual(photo.type, ShelterPhotoTypeChoices.INTERIOR)
