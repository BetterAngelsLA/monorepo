from django.test import TestCase

from common.utils import canonicalise_filename
from unittest_parametrize import ParametrizedTestCase, parametrize


class CommonUtilsTestCase(ParametrizedTestCase, TestCase):
    @parametrize(
        "mime_type, filename, expected_filename",
        [
            ("application/pdf", "doc", "doc.pdf"),
            ("application/pdf", "doc.PDF", "doc.PDF"),
            ("application/pdf", "doc.TXT", "doc.pdf"),
            ("application/pdf", "doc.foo", "doc.foo.pdf"),
            ("image/jpeg", "what%E2%80%99s%20this", "what’s this.jpg"),
            ("image/jpeg", "image.jpeg", "image.jpeg"),
            ("image/jpeg", "image.jpg", "image.jpg"),
            ("image/heic", "image", "image.heic"),
            ("video/mpeg", "video", "video.mpeg"),
            ("video/mpeg", "video.mpg", "video.mpg"),
            ("video/mpeg", "video.mpeg", "video.mpeg"),
            ("invalid_mime_type", "image.jpg", None),
        ],
    )
    def test_get_filename_with_extension(self, mime_type: str, filename: str, expected_filename: str | None) -> None:
        if expected_filename:
            self.assertEqual(canonicalise_filename(mime_type, filename), expected_filename)
        else:
            with self.assertRaises(ValueError):
                canonicalise_filename(mime_type, filename)
