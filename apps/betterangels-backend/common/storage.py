from typing import Any

import boto3
from botocore.client import Config
from django.conf import settings
from django.utils.encoding import filepath_to_uri
from mypy_boto3_s3 import S3Client
from storages.backends.s3 import S3Storage
from storages.utils import clean_name


class LocalS3Storage(S3Storage):
    """
    S3 storage inheriting from S3Storage for local dev.
    Overrides `url` to sign local dev read URLs with the public MinIO endpoint.

    In production S3Storage is used as-is because as the server is on AWS
    and the public/internal hostnames are the same (CloudFront/S3 endpoint).
    The override is only needed locally because the Django container uses the
    Docker network name minio while the client browser/device uses localhost.
    """

    _local_public_client: S3Client | None = None

    def _get_local_public_client(self) -> S3Client:
        if self._local_public_client is None:
            self._local_public_client = boto3.client(
                "s3",
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                aws_session_token=self.security_token,
                endpoint_url=settings.LOCAL_S3_PUBLIC_ENDPOINT_URL,
                region_name=self.region_name or settings.AWS_REGION,
                verify=self.verify,
                config=Config(
                    signature_version=self.signature_version,
                    s3={"addressing_style": self.addressing_style},
                ),
            )

        return self._local_public_client

    def get_client_for_presigned_urls(self) -> S3Client:
        """
        Return a boto3 S3 client that generates browser-reachable presigned URLs.
        Uses the public MinIO endpoint instead of the Docker-internal one.
        """
        return self._get_local_public_client()

    def url(
        self,
        name: str,
        parameters: dict[str, Any] | None = None,
        expire: int | None = None,
        http_method: str | None = None,
    ) -> str:
        if not settings.LOCAL_S3_PUBLIC_ENDPOINT_URL:
            return super().url(name, parameters=parameters, expire=expire, http_method=http_method)  # type: ignore[no-any-return]

        params = parameters.copy() if parameters else {}

        if expire is None:
            expire = self.querystring_expire

        normalized_name = self._normalize_name(clean_name(name))
        params["Bucket"] = self.bucket_name
        params["Key"] = normalized_name

        if self.querystring_auth:
            return self._get_local_public_client().generate_presigned_url(
                ClientMethod="get_object",
                Params=params,
                ExpiresIn=expire,
                HttpMethod=http_method,  # type: ignore[arg-type]
            )

        return (
            f"{settings.LOCAL_S3_PUBLIC_ENDPOINT_URL.rstrip('/')}/{self.bucket_name}/{filepath_to_uri(normalized_name)}"
        )
