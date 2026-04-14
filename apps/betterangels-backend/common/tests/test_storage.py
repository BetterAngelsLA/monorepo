from unittest.mock import Mock, patch

from common.storage import LocalS3Storage
from django.test import SimpleTestCase, override_settings


@override_settings(LOCAL_S3_PUBLIC_ENDPOINT_URL="http://localhost:9000", AWS_REGION="us-west-2")
class LocalS3StorageTest(SimpleTestCase):
    @patch("common.storage.boto3.client")
    def test_url_uses_public_local_endpoint(self, mock_boto_client: Mock) -> None:
        client = Mock()
        client.generate_presigned_url.return_value = (
            "http://localhost:9000/betterangels-local/media/client_profile_photos/test.png?X-Amz-Signature=abc"
        )
        mock_boto_client.return_value = client

        storage = LocalS3Storage(
            bucket_name="betterangels-local",
            endpoint_url="http://minio:9000",
            location="media",
            addressing_style="path",
            signature_version="s3v4",
            access_key="minioadmin",
            secret_key="minioadmin",
        )

        url = storage.url("client_profile_photos/test.png")

        self.assertEqual(
            url,
            "http://localhost:9000/betterangels-local/media/client_profile_photos/test.png?X-Amz-Signature=abc",
        )
        mock_boto_client.assert_called_once()
        call_kwargs = mock_boto_client.call_args.kwargs
        self.assertEqual(call_kwargs["endpoint_url"], "http://localhost:9000")

        client.generate_presigned_url.assert_called_once_with(
            ClientMethod="get_object",
            Params={
                "Bucket": "betterangels-local",
                "Key": "media/client_profile_photos/test.png",
            },
            ExpiresIn=3600,
            HttpMethod=None,
        )

    @patch("common.storage.boto3.client")
    def test_get_external_client_returns_public_client(self, mock_boto_client: Mock) -> None:
        client = Mock()
        mock_boto_client.return_value = client

        storage = LocalS3Storage(
            bucket_name="betterangels-local",
            endpoint_url="http://minio:9000",
            location="media",
            addressing_style="path",
            signature_version="s3v4",
            access_key="minioadmin",
            secret_key="minioadmin",
        )

        result = storage.get_external_client()

        self.assertIs(result, client)
        mock_boto_client.assert_called_once()
        call_kwargs = mock_boto_client.call_args.kwargs
        self.assertEqual(call_kwargs["endpoint_url"], "http://localhost:9000")


class LocalS3StorageFallbackTest(SimpleTestCase):
    @override_settings(LOCAL_S3_PUBLIC_ENDPOINT_URL="", AWS_REGION="us-west-2")
    @patch("common.storage.boto3.client")
    def test_url_falls_back_to_base_s3_storage_when_public_endpoint_not_set(self, mock_boto_client: Mock) -> None:
        storage = LocalS3Storage(
            bucket_name="betterangels-local",
            endpoint_url="http://minio:9000",
            location="media",
            addressing_style="path",
            signature_version="s3v4",
            access_key="minioadmin",
            secret_key="minioadmin",
        )

        url = storage.url("client_profile_photos/test.png")

        # Ensure we never create a separate public client with a custom endpoint URL.
        for _, kwargs in mock_boto_client.call_args_list:
            self.assertNotEqual(
                kwargs.get("endpoint_url"),
                "http://localhost:9000",
                "A public S3 client should not be created when LOCAL_S3_PUBLIC_ENDPOINT_URL is not set.",
            )

        self.assertIn("betterangels-local", url)
        self.assertIn("client_profile_photos/test.png", url)
