import os
from typing import Optional, cast

from common.imgproxy import build_imgproxy_url
from storages.backends.s3 import S3Storage

IMGPROXY_SUPPORTED_EXTENSIONS = frozenset(
    {
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".bmp",
        ".tiff",
        ".tif",
        ".ico",
        ".svg",
        ".avif",
        ".heic",
        ".heif",
    }
)


class ImgproxyS3Storage(S3Storage):
    """S3 storage: imgproxy URLs for images, CloudFront signed URLs otherwise."""

    def s3_source_url(self, name: str) -> str:
        key = f"{self.location}/{name}" if self.location else name

        return f"s3://{self.bucket_name}/{key}"

    def url(
        self,
        name: str,
        parameters: Optional[dict] = None,
        expire: Optional[int] = None,
        http_method: Optional[str] = None,
    ) -> str:
        if os.path.splitext(name)[-1].lower() in IMGPROXY_SUPPORTED_EXTENSIONS:
            if url := build_imgproxy_url(self.s3_source_url(name)):
                return url

        # Non-image or imgproxy not configured → CloudFront signed URL
        return cast(str, super().url(name, parameters, expire, http_method))
