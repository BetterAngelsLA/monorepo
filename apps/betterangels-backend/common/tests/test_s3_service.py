from typing import Any, cast
from unittest.mock import MagicMock, patch

from common.services.s3 import (
    DEFAULT_MAX_FILE_SIZE,
    DEFAULT_UPLOAD_EXPIRATION_SECONDS,
    PresignedS3UploadInput,
    generate_s3_presigned_upload_urls,
)
from django.test import TestCase, override_settings

TEST_BUCKET = "betterangels-local"


@override_settings(AWS_S3_STORAGE_BUCKET_NAME=TEST_BUCKET)
class GenerateS3PresignedUploadUrlsTestCase(TestCase):
    def _make_upload(self, **overrides: Any) -> PresignedS3UploadInput:
        base: dict[str, Any] = {
            "ref_id": "ref-1",
            "filename": "photo.jpg",
            "content_type": "image/jpeg",
            "upload_path": "attachments",
        }
        base.update(overrides)
        return cast(PresignedS3UploadInput, base)

    def _mock_generate_presigned_post(self, mock_boto3: MagicMock) -> MagicMock:
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        # By default, echo back the Key in fields so the key-match check passes.
        mock_client.generate_presigned_post.side_effect = lambda **kwargs: {
            "url": f"https://s3.amazonaws.com/{kwargs['Bucket']}",
            "fields": {"key": kwargs["Key"], "policy": "encoded-policy"},
        }
        return mock_client

    @patch("common.services.s3.boto3.client")
    def test_single_upload(self, mock_boto3: MagicMock) -> None:
        mock_client = self._mock_generate_presigned_post(mock_boto3)

        result = generate_s3_presigned_upload_urls(uploads=[self._make_upload()])

        self.assertEqual(len(result["uploads"]), 1)
        upload = result["uploads"][0]
        self.assertEqual(upload["ref_id"], "ref-1")
        self.assertIn(f"https://s3.amazonaws.com/{TEST_BUCKET}", upload["url"])
        self.assertTrue(upload["key"].startswith("attachments/"))
        self.assertTrue(upload["key"].endswith(".jpg"))
        self.assertIn("key", upload["fields"])

        mock_client.generate_presigned_post.assert_called_once()
        call_kwargs = mock_client.generate_presigned_post.call_args.kwargs
        self.assertEqual(call_kwargs["Bucket"], TEST_BUCKET)
        self.assertEqual(call_kwargs["ExpiresIn"], DEFAULT_UPLOAD_EXPIRATION_SECONDS)

    @patch("common.services.s3.boto3.client")
    def test_multiple_uploads(self, mock_boto3: MagicMock) -> None:
        self._mock_generate_presigned_post(mock_boto3)

        uploads = [
            self._make_upload(ref_id="ref-1", filename="a.pdf", content_type="application/pdf"),
            self._make_upload(ref_id="ref-2", filename="b.png", content_type="image/png"),
        ]
        result = generate_s3_presigned_upload_urls(uploads=uploads)

        self.assertEqual(len(result["uploads"]), 2)
        self.assertEqual(result["uploads"][0]["ref_id"], "ref-1")
        self.assertEqual(result["uploads"][1]["ref_id"], "ref-2")
        self.assertTrue(result["uploads"][0]["key"].endswith(".pdf"))
        self.assertTrue(result["uploads"][1]["key"].endswith(".png"))

    @patch("common.services.s3.boto3.client")
    def test_empty_uploads(self, mock_boto3: MagicMock) -> None:
        self._mock_generate_presigned_post(mock_boto3)

        result = generate_s3_presigned_upload_urls(uploads=[])

        self.assertEqual(result["uploads"], [])

    @patch("common.services.s3.boto3.client")
    def test_custom_expires_in_and_max_file_size(self, mock_boto3: MagicMock) -> None:
        mock_client = self._mock_generate_presigned_post(mock_boto3)

        upload = self._make_upload(expires_in=600, max_file_size=5_000_000)
        generate_s3_presigned_upload_urls(uploads=[upload])

        call_kwargs = mock_client.generate_presigned_post.call_args.kwargs
        self.assertEqual(call_kwargs["ExpiresIn"], 600)
        # Verify max_file_size appears in the conditions
        conditions = call_kwargs["Conditions"]
        content_length_conditions = [c for c in conditions if isinstance(c, list) and c[0] == "content-length-range"]
        self.assertEqual(len(content_length_conditions), 1)
        self.assertEqual(content_length_conditions[0][2], 5_000_000)

    @patch("common.services.s3.boto3.client")
    def test_default_max_file_size_in_conditions(self, mock_boto3: MagicMock) -> None:
        mock_client = self._mock_generate_presigned_post(mock_boto3)

        generate_s3_presigned_upload_urls(uploads=[self._make_upload()])

        call_kwargs = mock_client.generate_presigned_post.call_args.kwargs
        conditions = call_kwargs["Conditions"]
        content_length_conditions = [c for c in conditions if isinstance(c, list) and c[0] == "content-length-range"]
        self.assertEqual(content_length_conditions[0][2], DEFAULT_MAX_FILE_SIZE)

    @patch("common.services.s3.boto3.client")
    def test_content_type_in_conditions(self, mock_boto3: MagicMock) -> None:
        mock_client = self._mock_generate_presigned_post(mock_boto3)

        generate_s3_presigned_upload_urls(
            uploads=[self._make_upload(content_type="application/pdf")],
        )

        call_kwargs = mock_client.generate_presigned_post.call_args.kwargs
        conditions = call_kwargs["Conditions"]
        self.assertIn({"Content-Type": "application/pdf"}, conditions)
        self.assertEqual(call_kwargs["Fields"], {"Content-Type": "application/pdf"})

    @patch("common.services.s3.boto3.client")
    def test_upload_path_starts_with_condition(self, mock_boto3: MagicMock) -> None:
        mock_client = self._mock_generate_presigned_post(mock_boto3)

        generate_s3_presigned_upload_urls(
            uploads=[self._make_upload(upload_path="attachments/docs")],
        )

        call_kwargs = mock_client.generate_presigned_post.call_args.kwargs
        conditions = call_kwargs["Conditions"]
        starts_with_conditions = [c for c in conditions if isinstance(c, list) and c[0] == "starts-with"]
        self.assertEqual(len(starts_with_conditions), 1)
        self.assertEqual(starts_with_conditions[0], ["starts-with", "$key", "attachments/docs/"])

    @patch("common.services.s3.boto3.client")
    def test_missing_fields_key_raises(self, mock_boto3: MagicMock) -> None:
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_post.return_value = {
            "url": "https://s3.amazonaws.com/test-bucket",
            "fields": {},
        }

        with self.assertRaises(RuntimeError, msg="Presigned POST response missing 'fields.key'"):
            generate_s3_presigned_upload_urls(uploads=[self._make_upload()])

    @patch("common.services.s3.boto3.client")
    def test_key_mismatch_raises(self, mock_boto3: MagicMock) -> None:
        mock_client = MagicMock()
        mock_boto3.return_value = mock_client
        mock_client.generate_presigned_post.return_value = {
            "url": "https://s3.amazonaws.com/test-bucket",
            "fields": {"key": "wrong/key.jpg"},
        }

        with self.assertRaises(RuntimeError, msg="Presigned POST key mismatch"):
            generate_s3_presigned_upload_urls(uploads=[self._make_upload()])
