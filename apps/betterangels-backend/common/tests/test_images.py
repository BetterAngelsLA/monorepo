from types import SimpleNamespace
from unittest.mock import PropertyMock, patch

from common.enums import ImagePresetEnum
from common.images import build_img_url
from common.imgproxy import IMGPROXY_SWITCH
from django.db.models.fields.files import FieldFile
from django.test import TestCase, override_settings
from waffle.testutils import override_switch

TEST_KEY = "736563726574"
TEST_SALT = "68656C6C6F"


def _make_field_file(
    name: str = "photo.jpg",
    bucket_name: str = "test-bucket",
    location: str = "media",
) -> FieldFile:
    """Create a FieldFile-like mock that satisfies isinstance checks."""
    file = FieldFile.__new__(FieldFile)
    file.name = name
    storage = SimpleNamespace(
        bucket_name=bucket_name,
        location=location,
    )
    file.storage = storage  # type: ignore[assignment]
    return file


# ---------------------------------------------------------------------------
# build_img_url
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT)
class BuildImgUrlTest(TestCase):
    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_returns_imgproxy_url_with_preset(self) -> None:
        file = _make_field_file()
        url = build_img_url(file, preset=ImagePresetEnum.MD)
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fill:400:400", url)

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_returns_imgproxy_url_with_processing_options(self) -> None:
        file = _make_field_file()
        url = build_img_url(file, processing_options="rs:fit:800:600/q:80")
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fit:800:600", url)

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_processing_options_take_precedence_over_preset(self) -> None:
        file = _make_field_file()
        url = build_img_url(file, preset=ImagePresetEnum.SM, processing_options="rs:fit:999:999")
        self.assertIn("rs:fit:999:999", url)
        self.assertNotIn("rs:fill:100:100", url)

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_no_preset_or_options_uses_original(self) -> None:
        file = _make_field_file()
        url = build_img_url(file)
        self.assertIn("rs:force:0:0", url)

    @override_switch(IMGPROXY_SWITCH, active=False)
    def test_falls_back_when_imgproxy_disabled(self) -> None:
        file = _make_field_file()
        with patch.object(FieldFile, "url", new_callable=PropertyMock, return_value="https://cdn/fallback.jpg"):
            url = build_img_url(file)
        self.assertEqual(url, "https://cdn/fallback.jpg")

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_falls_back_when_no_source_url(self) -> None:
        """imgproxy enabled but build_imgproxy_url can't build a URL (no storage)."""
        file = FieldFile.__new__(FieldFile)
        file.name = "x"
        file.storage = None  # type: ignore[assignment]
        with patch.object(FieldFile, "url", new_callable=PropertyMock, return_value="https://cdn/fallback.jpg"):
            url = build_img_url(file, preset=ImagePresetEnum.MD)
        self.assertEqual(url, "https://cdn/fallback.jpg")

    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_falls_back_when_imgproxy_raises(self) -> None:
        """If build_imgproxy_url raises, fall back to file.url."""
        file = _make_field_file()
        with (
            patch("common.images.build_imgproxy_url", side_effect=ValueError("bad hex key")),
            patch.object(FieldFile, "url", new_callable=PropertyMock, return_value="https://cdn/fallback.jpg"),
        ):
            url = build_img_url(file, preset=ImagePresetEnum.MD)
        self.assertEqual(url, "https://cdn/fallback.jpg")
