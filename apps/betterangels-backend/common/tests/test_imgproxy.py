import base64
import datetime
from types import SimpleNamespace
from typing import Optional, cast
from unittest.mock import MagicMock
from django.conf import settings
from common.enums import ImagePresetEnum
from common.imgproxy import (
    IMGPROXY_SWITCH,
    _build_signed_imgproxy_path,
    _encode_source_url,
    _get_image_source_url,
    _get_imgproxy_signature,
    _resolve_imgproxy_ops,
    build_imgproxy_url,
    is_imgproxy_enabled,
)
from django.test import TestCase, override_settings
from unittest_parametrize import ParametrizedTestCase, parametrize
from waffle.testutils import override_switch
from django.core.files.uploadedfile import SimpleUploadedFile

TEST_KEY = "736563726574"
TEST_SALT = "68656C6C6F"
TEST_PREFIX = "imgproxy"


# ---------------------------------------------------------------------------
# is_imgproxy_enabled
# ---------------------------------------------------------------------------
class IsImgproxyEnabledTest(ParametrizedTestCase, TestCase):
    """is_imgproxy_enabled only checks IMGPROXY_KEY, IMGPROXY_SALT, and the waffle switch."""

    @parametrize(
        "key, salt, switch_active, expected",
        [
            ("", TEST_SALT, True, False),
            (TEST_KEY, "", True, False),
            (TEST_KEY, TEST_SALT, None, False),
            (TEST_KEY, TEST_SALT, False, False),
            (TEST_KEY, TEST_SALT, True, True),
        ],
    )
    def test_is_imgproxy_enabled(self, key: str, salt: str, switch_active: Optional[bool], expected: bool) -> None:
        with override_settings(IMGPROXY_KEY=key, IMGPROXY_SALT=salt):
            if switch_active is not None:
                with override_switch(IMGPROXY_SWITCH, active=switch_active):
                    self.assertEqual(is_imgproxy_enabled(), expected)
            else:
                self.assertEqual(is_imgproxy_enabled(), expected)


# ---------------------------------------------------------------------------
# _resolve_imgproxy_ops
# ---------------------------------------------------------------------------
class ResolveImgproxyOpsTest(TestCase):
    def test_returns_processing_when_provided(self) -> None:
        self.assertIsNone(_resolve_imgproxy_ops(None, None))
        self.assertEqual(_resolve_imgproxy_ops(None, "rs:fill:100:100/f:jpg"), "rs:fill:100:100/f:jpg")
        self.assertEqual(_resolve_imgproxy_ops(ImagePresetEnum.ORIGINAL, None), "rs:force:0:0")


# ---------------------------------------------------------------------------
# _encode_source_url
# ---------------------------------------------------------------------------
class EncodeSourceUrlTest(TestCase):
    def test_encodes_url_to_urlsafe_base64_without_padding(self) -> None:
        url = "s3://my-bucket/photos/img.jpg"
        encoded = _encode_source_url(url)
        # Must be URL-safe base64 with no '=' padding
        self.assertNotIn("=", encoded)
        decoded = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        self.assertEqual(decoded.decode(), url)

    def test_handles_special_characters(self) -> None:
        url = "s3://bucket/path with spaces/key?q=1&x=2"
        encoded = _encode_source_url(url)
        decoded = base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4))
        self.assertEqual(decoded.decode(), url)


# ---------------------------------------------------------------------------
# _get_imgproxy_signature
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class SignImgproxyPathTest(TestCase):
    def test_returns_urlsafe_base64_without_padding(self) -> None:
        sig = str(_get_imgproxy_signature("rs:fill:100:100/abc"))
        self.assertIsNotNone(sig)
        self.assertNotIn("=", sig)
        self.assertNotIn("+", sig)
        self.assertNotIn("/", sig.replace("_", "").replace("-", ""))

    def test_deterministic_for_same_path(self) -> None:
        sig1 = _get_imgproxy_signature("same/path")
        sig2 = _get_imgproxy_signature("same/path")
        self.assertEqual(sig1, sig2)

    def test_different_signatures_for_different_paths(self) -> None:
        sig_a = _get_imgproxy_signature("path/a")
        sig_b = _get_imgproxy_signature("path/b")
        self.assertNotEqual(sig_a, sig_b)


# ---------------------------------------------------------------------------
# _build_signed_imgproxy_path
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class BuildImgproxyPathTest(TestCase):
    SOURCE = "s3://bucket/photo.jpg"

    def test_processed_path(self) -> None:
        path = str(_build_signed_imgproxy_path(self.SOURCE, ops="rs:fill:100:100"))
        # Path is signature/ops/encoded_source (no IMGPROXY_PATH_PREFIX in the path)
        self.assertIn("rs:fill:100:100", path)
        self.assertNotIn("=", path)


# ---------------------------------------------------------------------------
# _get_image_source_url
# ---------------------------------------------------------------------------
class GetImageSourceUrlTest(ParametrizedTestCase, TestCase):
    def test_returns_none_for_none(self) -> None:
        self.assertIsNone(_get_image_source_url(None))

    def test_returns_none_for_falsy_file(self) -> None:
        self.assertIsNone(_get_image_source_url(""))

    def test_returns_none_when_no_storage(self) -> None:
        file = SimpleNamespace(name="photo.jpg")
        self.assertIsNone(_get_image_source_url(file))

    def test_returns_none_when_no_name(self) -> None:
        file = SimpleNamespace(storage=SimpleNamespace())
        self.assertIsNone(_get_image_source_url(file))

    @override_settings(IS_LOCAL_DEV=False)
    def test_s3_with_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location="media"),
        )
        self.assertEqual(_get_image_source_url(file), "s3://my-bucket/media/photo.jpg")

    @override_settings(IS_LOCAL_DEV=False, IMGPROXY_PREFIX="/imgproxy")
    def test_s3_without_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location=""),
        )
        self.assertEqual(_get_image_source_url(file), "s3://my-bucket/photo.jpg")

    @override_settings(IS_LOCAL_DEV=False)
    def test_s3_with_none_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location=None),
        )
        self.assertEqual(_get_image_source_url(file), "s3://my-bucket/photo.jpg")

    @override_settings(IS_LOCAL_DEV=True)
    def test_local_dev_with_source_base_url(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(),
            url=f"{settings.MEDIA_URL}photos/photo.jpg",
        )
        self.assertEqual(
            _get_image_source_url(file),
            f"{settings.IMGPROXY_LOCAL_MEDIA_URL}photos/photo.jpg",
        )

    @override_settings(IS_LOCAL_DEV=True)
    def test_local_dev_returns_none_when_no_file_url(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(),
        )
        self.assertIsNone(_get_image_source_url(file))

    @override_settings(IS_LOCAL_DEV=False)
    def test_returns_none_when_storage_raises_attribute_error(self) -> None:
        class StorageMissingBucket:
            location = "media"

        file = SimpleNamespace(name="photo.jpg", storage=StorageMissingBucket())
        self.assertIsNone(_get_image_source_url(file))


# ---------------------------------------------------------------------------
# build_imgproxy_url
# ---------------------------------------------------------------------------
def _make_file(
    name: str = "photo.jpg",
    url: str = "/media/photo.jpg",
    bucket_name: str = "test-bucket",
    location: str = "media",
) -> SimpleNamespace:
    storage = SimpleNamespace(
        bucket_name=bucket_name,
        location=location,
        custom_domain="cdn.example.com",
        url_protocol="https:",
        cloudfront_signer=None,
        querystring_expire=3600,
    )
    return SimpleNamespace(name=name, storage=storage, url=url)


@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class BuildImgproxyUrlTest(TestCase):
    @override_settings(
        IS_LOCAL_DEV=True
    )
    def test_local_dev_returns_local_url(self) -> None:
        file = _make_file()
        url = build_imgproxy_url(file, ImagePresetEnum.SM, None)
        assert url
        self.assertTrue(url.startswith(settings.IMGPROXY_LOCAL_URL))

    @override_settings(IS_LOCAL_DEV=False)
    def test_production_returns_none_without_cloudfront_signer(self) -> None:
        file = _make_file()
        url = build_imgproxy_url(file, ImagePresetEnum.SM, None)
        self.assertIsNone(url)

    @override_settings(IS_LOCAL_DEV=False, IMGPROXY_PATH_PREFIX="")
    def test_production_returns_none_when_imgproxy_path_prefix_empty(self) -> None:
        signer = MagicMock()
        signer.generate_presigned_url.return_value = "https://cdn.example.com/signed-url"
        file = _make_file()
        file.storage.cloudfront_signer = signer
        url = build_imgproxy_url(file, ImagePresetEnum.SM, None)
        self.assertIsNone(url)
        signer.generate_presigned_url.assert_not_called()

    @override_settings(IS_LOCAL_DEV=False)
    def test_production_with_cloudfront_signer(self) -> None:
        signer = MagicMock()
        signer.generate_presigned_url.return_value = "https://cdn.example.com/signed-url"
        file = _make_file()
        file.storage.cloudfront_signer = signer
        url = build_imgproxy_url(file, ImagePresetEnum.SM, "rs:fill:100:100")
        self.assertEqual(url, "https://cdn.example.com/signed-url")
        signer.generate_presigned_url.assert_called_once()
        call_url = signer.generate_presigned_url.call_args[0][0]
        self.assertIn(TEST_PREFIX, call_url)
        self.assertIn("rs:fill:100:100", call_url)
        call_kw = signer.generate_presigned_url.call_args[1]
        self.assertIn("date_less_than", call_kw)
        self.assertGreater(
            call_kw["date_less_than"],
            datetime.datetime.now(datetime.timezone.utc),
            "date_less_than should be in the future",
        )

    def test_returns_none_when_no_preset_or_processing(self) -> None:
        file = _make_file()
        with override_settings(
            IS_LOCAL_DEV=True,
            IMGPROXY_LOCAL_URL="http://localhost:8080",
        ):
            url = build_imgproxy_url(file, None, None)
        self.assertIsNone(url)

    def test_returns_none_when_no_source_url(self) -> None:
        file = SimpleNamespace(name="x", storage=None)
        with override_settings(
            IS_LOCAL_DEV=True,
            IMGPROXY_LOCAL_URL="http://localhost:8080",
        ):
            url = build_imgproxy_url(file, ImagePresetEnum.SM, None)
        self.assertIsNone(url)

    def test_processing_takes_precedence_over_preset(self) -> None:
        file = _make_file()
        with override_settings(
            IS_LOCAL_DEV=True,
            IMGPROXY_LOCAL_URL="http://localhost:8080",
        ):
            url = build_imgproxy_url(file, ImagePresetEnum.SM, "rs:fit:999:999")
        assert url
        self.assertIn("rs:fit:999:999", url)
        self.assertNotIn("rs:fill:100:100", url)


# ---------------------------------------------------------------------------
# BaImageType.url()
# ---------------------------------------------------------------------------
def _image_url_resolver(
    root: object, preset: Optional[ImagePresetEnum] = None, processing: Optional[str] = None
) -> str:
    """Exercise the same logic as BaImageType.url (cannot call the Strawberry field directly)."""
    if is_imgproxy_enabled():
        if imgproxy_url := build_imgproxy_url(root, preset, processing):
            return imgproxy_url

    return cast(str, getattr(root, "url", ""))


@override_settings(
    IMGPROXY_KEY=TEST_KEY,
    IMGPROXY_SALT=TEST_SALT,
)
class BaImageTypeUrlTest(TestCase):
    def _make_file(self, name: str = "photo.jpg", url: str = "https://cdn/photo.jpg") -> SimpleNamespace:
        return SimpleNamespace(
            name=name,
            storage=SimpleNamespace(bucket_name="test-bucket", location="media"),
            url=url,
        )

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_preset_url(self) -> None:
        file = self._make_file()
        url = _image_url_resolver(file, preset=ImagePresetEnum.MD)
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fill:400:400", url)

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_raw_processing_url(self) -> None:
        file = self._make_file()
        url = _image_url_resolver(file, processing="rs:fit:800:600/q:80")
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fit:800:600", url)

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_processing_takes_precedence_over_preset(self) -> None:
        file = self._make_file()
        url = _image_url_resolver(file, preset=ImagePresetEnum.SM, processing="rs:fit:999:999")
        self.assertIn("rs:fit:999:999", url)
        self.assertNotIn("rs:fill:100:100", url)

    @override_switch(IMGPROXY_SWITCH, active=False)
    def test_url_falls_back_when_imgproxy_disabled(self) -> None:
        file = self._make_file(url="https://cdn/fallback.jpg")
        url = _image_url_resolver(file, preset=ImagePresetEnum.MD)
        self.assertEqual(url, "https://cdn/fallback.jpg")

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_url_falls_back_when_no_preset_or_processing(self) -> None:
        file = self._make_file(url="https://cdn/photo.jpg")
        url = _image_url_resolver(file)
        assert url
        self.assertEqual(url, "https://cdn/photo.jpg")

    @override_settings(IS_LOCAL_DEV=True)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_url_falls_back_when_imgproxy_enabled_but_no_source_url(self) -> None:
        """When imgproxy is on but build_imgproxy_url returns None (e.g. no storage), return self.url."""
        file = SimpleNamespace(name="x", storage=None, url="https://cdn/fallback.jpg")
        url = _image_url_resolver(file, preset=ImagePresetEnum.MD)
        self.assertEqual(url, "https://cdn/fallback.jpg")
