from typing import Any
from unittest.mock import MagicMock, patch

from accounts.tests.baker_recipes import organization_recipe
from common.services.s3 import DEFAULT_UPLOAD_EXPIRATION_SECONDS
from django.test import TestCase
from model_bakery import baker
from shelters.enums import ShelterPhotoTypeChoices
from shelters.models import ShelterPhoto
from shelters.services.shelter_photo import (
    ALLOWED_CONTENT_TYPES,
    SERVICE_NAME,
    UPLOAD_PATH,
    _validate_content_type,
    create_presigned_uploads,
    resolve_uploads,
)
from shelters.tests.baker_recipes import shelter_recipe

# ---------------------------------------------------------------------------
# _validate_content_type
# ---------------------------------------------------------------------------


class ValidateContentTypeTest(TestCase):
    def test_allows_all_default_image_content_types(self) -> None:
        for ct in ALLOWED_CONTENT_TYPES:
            with self.subTest(content_type=ct):
                try:
                    _validate_content_type(ct, f"file.{ct.split('/')[-1]}")
                except ValueError:
                    self.fail(f"_validate_content_type raised for allowed type: {ct}")

    def test_rejects_pdf(self) -> None:
        with self.assertRaisesRegex(ValueError, "Unsupported content_type: application/pdf for filename=doc.pdf"):
            _validate_content_type("application/pdf", "doc.pdf")

    def test_rejects_empty_string(self) -> None:
        with self.assertRaisesRegex(ValueError, "Unsupported content_type:  for filename=file"):
            _validate_content_type("", "file")


# ---------------------------------------------------------------------------
# create_presigned_uploads
# ---------------------------------------------------------------------------


class CreatePresignedUploadsTest(TestCase):
    def setUp(self) -> None:
        self.user: Any = baker.make("accounts.User")
        self.org: Any = organization_recipe.make()
        self.shelter: Any = shelter_recipe.make(organization=self.org)
        self.org.users.add(self.user)

        upload = MagicMock()
        upload.ref_id = "ref-1"
        upload.filename = "photo.jpg"
        upload.content_type = "image/jpeg"
        self.upload = upload

    @patch("shelters.services.shelter_photo.create_upload_token")
    @patch("shelters.services.shelter_photo.generate_s3_presigned_upload_urls")
    def test_returns_presigned_upload_for_each_item(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {
            "uploads": [
                {
                    "ref_id": "ref-1",
                    "key": "media/shelters/shelter-id-1/abc.jpg",
                    "url": "https://s3.example.com/upload",
                    "fields": {"Policy": "xyz", "X-Amz-Signature": "sig"},
                }
            ]
        }
        mock_token.return_value = "token-abc"

        result = create_presigned_uploads(
            user=self.user,
            shelter_id=str(self.shelter.pk),
            uploads=[self.upload],
        )

        self.assertEqual(len(result["uploads"]), 1)
        item = result["uploads"][0]
        self.assertEqual(item["ref_id"], "ref-1")
        self.assertEqual(item["presigned_key"], "media/shelters/shelter-id-1/abc.jpg")
        self.assertEqual(item["url"], "https://s3.example.com/upload")
        self.assertEqual(item["fields"], {"Policy": "xyz", "X-Amz-Signature": "sig"})
        self.assertEqual(item["upload_token"], "token-abc")

    @patch("shelters.services.shelter_photo.create_upload_token")
    @patch("shelters.services.shelter_photo.generate_s3_presigned_upload_urls")
    def test_passes_correct_upload_path_to_s3(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        mock_s3.return_value = {"uploads": [{"ref_id": "ref-1", "key": "k", "url": "u", "fields": {}}]}
        mock_token.return_value = "t"

        create_presigned_uploads(
            user=self.user,
            shelter_id=str(self.shelter.pk),
            uploads=[self.upload],
        )

        mock_s3.assert_called_once_with(
            uploads=[
                {
                    "ref_id": "ref-1",
                    "filename": "photo.jpg",
                    "content_type": "image/jpeg",
                    "upload_path": UPLOAD_PATH,
                }
            ]
        )

    @patch("shelters.services.shelter_photo.create_upload_token")
    @patch("shelters.services.shelter_photo.generate_s3_presigned_upload_urls")
    def test_creates_token_with_correct_params(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        key = "media/shelters/42/abc.jpg"
        mock_s3.return_value = {"uploads": [{"ref_id": "ref-1", "key": key, "url": "u", "fields": {}}]}
        mock_token.return_value = "t"

        create_presigned_uploads(
            user=self.user,
            shelter_id=str(self.shelter.pk),
            uploads=[self.upload],
        )

        mock_token.assert_called_once_with(
            key=key,
            user_id=self.user.pk,
            expires_in_seconds=DEFAULT_UPLOAD_EXPIRATION_SECONDS,
            scope=SERVICE_NAME,
        )

    def test_rejects_invalid_content_type(self) -> None:
        self.upload.content_type = "application/pdf"

        with self.assertRaisesRegex(ValueError, "Unsupported content_type: application/pdf for filename=photo.jpg"):
            create_presigned_uploads(
                user=self.user,
                shelter_id=str(self.shelter.pk),
                uploads=[self.upload],
            )

    @patch("shelters.services.shelter_photo.create_upload_token")
    @patch("shelters.services.shelter_photo.generate_s3_presigned_upload_urls")
    def test_handles_multiple_uploads(self, mock_s3: MagicMock, mock_token: MagicMock) -> None:
        upload2 = MagicMock()
        upload2.ref_id = "ref-2"
        upload2.filename = "photo2.png"
        upload2.content_type = "image/png"

        mock_s3.return_value = {
            "uploads": [
                {"ref_id": "ref-1", "key": "k1", "url": "u1", "fields": {}},
                {"ref_id": "ref-2", "key": "k2", "url": "u2", "fields": {}},
            ]
        }
        mock_token.return_value = "t"

        result = create_presigned_uploads(
            user=self.user,
            shelter_id=str(self.shelter.pk),
            uploads=[self.upload, upload2],
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
        self.presigned_key = "media/shelters/42/abc.jpg"
        self.upload_token = "valid-token"

        strip_patcher = patch(
            "shelters.services.shelter_photo.strip_storage_location",
            side_effect=lambda key: key.removeprefix("media/"),
        )
        strip_patcher.start()
        self.addCleanup(strip_patcher.stop)

        self.photo_input = MagicMock()
        self.photo_input.presigned_key = self.presigned_key
        self.photo_input.upload_token = self.upload_token
        self.photo_input.filename = "photo.jpg"
        self.photo_input.content_type = "image/jpeg"
        self.photo_input.photo_type = ShelterPhotoTypeChoices.INTERIOR

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_creates_shelter_photo_record(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        initial_count = ShelterPhoto.objects.count()

        result = resolve_uploads(
            user=self.user,
            shelter_id=self.shelter.pk,
            photos=[self.photo_input],
        )

        self.assertEqual(len(result), 1)
        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 1)

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_saves_correct_file_path(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        result = resolve_uploads(
            user=self.user,
            shelter_id=self.shelter.pk,
            photos=[self.photo_input],
        )

        photo = result[0]
        photo.refresh_from_db()
        self.assertEqual(photo.file.name, "shelters/42/abc.jpg")

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_associates_photo_with_shelter(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        result = resolve_uploads(
            user=self.user,
            shelter_id=self.shelter.pk,
            photos=[self.photo_input],
        )

        self.assertEqual(result[0].shelter_id, self.shelter.pk)

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_validates_token_with_correct_params(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        resolve_uploads(
            user=self.user,
            shelter_id=self.shelter.pk,
            photos=[self.photo_input],
        )

        mock_validate.assert_called_once_with(
            upload_token=self.upload_token,
            key=self.presigned_key,
            user_id=self.user.pk,
            scope=SERVICE_NAME,
        )

    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=False)
    def test_raises_on_invalid_token(self, mock_validate: MagicMock) -> None:
        with self.assertRaisesRegex(ValueError, "Invalid or expired upload token for 'photo.jpg'"):
            resolve_uploads(
                user=self.user,
                shelter_id=self.shelter.pk,
                photos=[self.photo_input],
            )

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=False)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_raises_when_file_not_in_s3(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        with self.assertRaisesRegex(ValueError, "File not found in storage for 'photo.jpg'"):
            resolve_uploads(
                user=self.user,
                shelter_id=self.shelter.pk,
                photos=[self.photo_input],
            )

        self.assertEqual(ShelterPhoto.objects.filter(shelter=self.shelter).count(), 0)

    def test_raises_on_invalid_content_type(self) -> None:
        self.photo_input.content_type = "application/pdf"

        with self.assertRaisesRegex(ValueError, "Unsupported content_type: application/pdf for filename=photo.jpg"):
            resolve_uploads(
                user=self.user,
                shelter_id=self.shelter.pk,
                photos=[self.photo_input],
            )

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token", return_value=True)
    def test_creates_multiple_photos_atomically(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        photo2 = MagicMock()
        photo2.presigned_key = "media/shelters/42/def.png"
        photo2.upload_token = self.upload_token
        photo2.filename = "photo2.png"
        photo2.content_type = "image/png"
        photo2.photo_type = ShelterPhotoTypeChoices.EXTERIOR

        initial_count = ShelterPhoto.objects.count()

        resolve_uploads(
            user=self.user,
            shelter_id=self.shelter.pk,
            photos=[self.photo_input, photo2],
        )

        self.assertEqual(ShelterPhoto.objects.count(), initial_count + 2)

    @patch("shelters.services.shelter_photo.s3_key_exists", return_value=True)
    @patch("shelters.services.shelter_photo.validate_upload_token")
    def test_no_db_writes_when_any_token_invalid(self, mock_validate: MagicMock, mock_s3_exists: MagicMock) -> None:
        """Validation happens before any DB write — if one token fails, nothing is saved."""
        mock_validate.side_effect = [True, False]  # first valid, second invalid

        photo2 = MagicMock()
        photo2.presigned_key = "media/shelters/42/bad.png"
        photo2.upload_token = "bad-token"
        photo2.filename = "bad.png"
        photo2.content_type = "image/png"
        photo2.photo_type = ShelterPhotoTypeChoices.EXTERIOR

        initial_count = ShelterPhoto.objects.count()

        with self.assertRaisesRegex(ValueError, "Invalid or expired upload token for 'bad.png'"):
            resolve_uploads(
                user=self.user,
                shelter_id=self.shelter.pk,
                photos=[self.photo_input, photo2],
            )

        self.assertEqual(ShelterPhoto.objects.count(), initial_count)
