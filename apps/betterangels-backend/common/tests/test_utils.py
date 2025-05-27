from unittest import TestCase

from common.utils import get_filename_with_extension
from unittest_parametrize import ParametrizedTestCase, parametrize


class CommonUtilsTestCase(ParametrizedTestCase, TestCase):
    @parametrize(
        "mime_type, filename, expected_filename",
        [
            ("application/pdf", "doc", "doc.pdf"),
            ("application/pdf", "doc.PDF", "doc.PDF"),
            ("application/pdf", "doc.TXT", "doc.TXT.pdf"),
            ("application/pdf", "doc.foo", "doc.foo.pdf"),
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
            self.assertEqual(get_filename_with_extension(mime_type, filename), expected_filename)
        else:
            with self.assertRaises(ValueError):
                get_filename_with_extension(mime_type, filename)
