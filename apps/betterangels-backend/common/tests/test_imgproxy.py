import base64
from types import SimpleNamespace
from typing import Callable, cast
from unittest.mock import MagicMock, patch

from common.enums import ImagePresetEnum
from common.graphql.types import BaImageType, resolve_image
from common.imgproxy import (
    IMGPROXY_SWITCH,
    _build_imgproxy_path,
    _encode_source_url,
    _sign_imgproxy_path,
    build_imgproxy_url,
    get_imgproxy_source_url,
    is_imgproxy_enabled,
)
from django.test import TestCase, override_settings
from unittest_parametrize import ParametrizedTestCase
from waffle.testutils import override_switch

TEST_KEY = "736563726574"
TEST_SALT = "68656C6C6F"
TEST_PREFIX = "imgproxy"


# ---------------------------------------------------------------------------
# is_imgproxy_enabled
# ---------------------------------------------------------------------------
class IsImgproxyEnabledTest(TestCase):
    @override_settings(IMGPROXY_KEY="", IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
    def test_disabled_when_key_missing(self) -> None:
        self.assertFalse(is_imgproxy_enabled())

    @override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT="", IMGPROXY_PATH_PREFIX=TEST_PREFIX)
    def test_disabled_when_salt_missing(self) -> None:
        self.assertFalse(is_imgproxy_enabled())

    @override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX="")
    def test_disabled_when_path_prefix_missing(self) -> None:
        self.assertFalse(is_imgproxy_enabled())

    @override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_enabled_when_env_vars_set_and_switch_on(self) -> None:
        self.assertTrue(is_imgproxy_enabled())


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
# _sign_imgproxy_path
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class SignImgproxyPathTest(TestCase):
    def test_returns_urlsafe_base64_without_padding(self) -> None:
        sig = str(_sign_imgproxy_path("rs:fill:100:100/abc"))
        self.assertIsNotNone(sig)
        self.assertNotIn("=", sig)
        self.assertNotIn("+", sig)
        self.assertNotIn("/", sig.replace("_", "").replace("-", ""))

    def test_deterministic_for_same_path(self) -> None:
        sig1 = _sign_imgproxy_path("same/path")
        sig2 = _sign_imgproxy_path("same/path")
        self.assertEqual(sig1, sig2)

    def test_different_signatures_for_different_paths(self) -> None:
        sig_a = _sign_imgproxy_path("path/a")
        sig_b = _sign_imgproxy_path("path/b")
        self.assertNotEqual(sig_a, sig_b)


# ---------------------------------------------------------------------------
# _build_imgproxy_path
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class BuildImgproxyPathTest(TestCase):
    SOURCE = "s3://bucket/photo.jpg"

    def test_processed_path(self) -> None:
        path = str(_build_imgproxy_path(self.SOURCE, processing="rs:fill:100:100"))
        self.assertStartsWith(path, f"{TEST_PREFIX}/")
        self.assertIn("rs:fill:100:100", path)


# ---------------------------------------------------------------------------
# build_imgproxy_url
# ---------------------------------------------------------------------------
@override_settings(IMGPROXY_KEY=TEST_KEY, IMGPROXY_SALT=TEST_SALT, IMGPROXY_PATH_PREFIX=TEST_PREFIX)
class BuildImgproxyUrlTest(TestCase):
    SOURCE = "s3://bucket/photo.jpg"

    @override_settings(IMGPROXY_BASE_URL="http://localhost:8080")
    def test_local_dev_returns_base_url(self) -> None:
        url = build_imgproxy_url(self.SOURCE, "rs:fill:100:100")
        self.assertIsNotNone(url)
        self.assertTrue(url.startswith("http://localhost:8080/"))  # type: ignore[union-attr]

    @override_settings(IMGPROXY_BASE_URL="http://localhost:8080/")
    def test_local_dev_strips_trailing_slash(self) -> None:
        url = build_imgproxy_url(self.SOURCE)
        self.assertIsNotNone(url)
        self.assertNotIn("//", url.split("://", 1)[1])  # type: ignore[union-attr]

    @override_settings(IMGPROXY_BASE_URL="")
    def test_production_uses_storage_custom_domain(self) -> None:
        storage = SimpleNamespace(
            custom_domain="cdn.example.com",
            url_protocol="https:",
            cloudfront_signer=None,
        )
        url = build_imgproxy_url(self.SOURCE, storage=storage)
        self.assertIsNotNone(url)
        self.assertTrue(url.startswith("https://cdn.example.com/"))  # type: ignore[union-attr]

    @override_settings(IMGPROXY_BASE_URL="")
    def test_production_with_cloudfront_signer(self) -> None:
        signer = MagicMock()
        signer.generate_presigned_url.return_value = "https://cdn.example.com/signed-url"
        storage = SimpleNamespace(
            custom_domain="cdn.example.com",
            url_protocol="https:",
            cloudfront_signer=signer,
            querystring_expire=3600,
        )
        url = build_imgproxy_url(self.SOURCE, "rs:fill:100:100", storage=storage)
        self.assertEqual(url, "https://cdn.example.com/signed-url")
        signer.generate_presigned_url.assert_called_once()

    @override_settings(IMGPROXY_BASE_URL="")
    def test_falls_back_to_default_storage(self) -> None:
        mock_storage = SimpleNamespace(
            custom_domain="cdn.example.com",
            url_protocol="https:",
            cloudfront_signer=None,
        )
        with patch("common.imgproxy.default_storage", mock_storage, create=True):
            # The import happens inside the function, so we patch the module-level ref.
            with patch("django.core.files.storage.default_storage", mock_storage):
                url = str(build_imgproxy_url(self.SOURCE, storage=None))
        self.assertIsNotNone(url)
        self.assertIn("cdn.example.com", url)  # type: ignore[operator]


# ---------------------------------------------------------------------------
# get_imgproxy_source_url
# ---------------------------------------------------------------------------
class GetImgproxySourceUrlTest(ParametrizedTestCase, TestCase):
    def test_returns_none_for_none(self) -> None:
        self.assertIsNone(get_imgproxy_source_url(None))

    def test_returns_none_for_falsy_file(self) -> None:
        self.assertIsNone(get_imgproxy_source_url(""))

    def test_returns_none_when_no_storage(self) -> None:
        file = SimpleNamespace(name="photo.jpg")
        self.assertIsNone(get_imgproxy_source_url(file))

    def test_returns_none_when_no_name(self) -> None:
        file = SimpleNamespace(storage=SimpleNamespace())
        self.assertIsNone(get_imgproxy_source_url(file))

    def test_s3_with_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location="media"),
        )
        self.assertEqual(get_imgproxy_source_url(file), "s3://my-bucket/media/photo.jpg")

    def test_s3_without_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location=""),
        )
        self.assertEqual(get_imgproxy_source_url(file), "s3://my-bucket/photo.jpg")

    def test_s3_with_none_location(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(bucket_name="my-bucket", location=None),
        )
        self.assertEqual(get_imgproxy_source_url(file), "s3://my-bucket/photo.jpg")

    @override_settings(IMGPROXY_INTERNAL_BASE_URL="http://backend:8000")
    def test_local_dev_with_internal_base_url(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(),  # no bucket_name
        )
        self.assertEqual(
            get_imgproxy_source_url(file),
            "http://backend:8000/media/photo.jpg",
        )

    @override_settings(IMGPROXY_INTERNAL_BASE_URL=None)
    def test_fallback_to_file_url(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(),
            url="https://example.com/media/photo.jpg",
        )
        self.assertEqual(
            get_imgproxy_source_url(file),
            "https://example.com/media/photo.jpg",
        )

    @override_settings(IMGPROXY_INTERNAL_BASE_URL=None)
    def test_returns_none_when_url_not_string(self) -> None:
        file = SimpleNamespace(
            name="photo.jpg",
            storage=SimpleNamespace(),
            url=42,
        )
        self.assertIsNone(get_imgproxy_source_url(file))


# ---------------------------------------------------------------------------
# BaImageType.url() & resolve_image()
# ---------------------------------------------------------------------------
# Strawberry types expose .url as StrawberryField; at runtime it's callable. Cast for mypy.
def _image_url(img: BaImageType, *args: object, **kwargs: object) -> str:
    return cast(Callable[..., str], img.url)(*args, **kwargs)


@override_settings(
    IMGPROXY_KEY=TEST_KEY,
    IMGPROXY_SALT=TEST_SALT,
    IMGPROXY_BASE_URL="http://localhost:8080",
    IMGPROXY_PATH_PREFIX=TEST_PREFIX,
    IMGPROXY_INTERNAL_BASE_URL="http://backend:8000",
)
class BaImageTypeUrlTest(TestCase):
    def _make_file(self, name: str = "photo.jpg", url: str = "https://cdn/photo.jpg") -> SimpleNamespace:
        return SimpleNamespace(
            name=name,
            storage=SimpleNamespace(bucket_name="test-bucket", location="media"),
            url=url,
        )

    def _make_image_type(self, file: object) -> BaImageType:
        return BaImageType(name="photo.jpg", _file=file)  # type: ignore[arg-type]

    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_preset_url(self) -> None:
        img = self._make_image_type(self._make_file())

        url = _image_url(img, preset=ImagePresetEnum.MD)
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fill:400:400", url)

    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_raw_processing_url(self) -> None:
        img = self._make_image_type(self._make_file())

        url = _image_url(img, processing="rs:fit:800:600/q:80")
        self.assertIn("localhost:8080", url)
        self.assertIn("rs:fit:800:600", url)

    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_processing_takes_precedence_over_preset(self) -> None:
        img = self._make_image_type(self._make_file())

        url = _image_url(img, preset=ImagePresetEnum.SM, processing="rs:fit:999:999")
        self.assertIn("rs:fit:999:999", url)
        self.assertNotIn("rs:fill:100:100", url)

    def test_url_falls_back_when_imgproxy_disabled(self) -> None:
        img = self._make_image_type(self._make_file(url="https://cdn/fallback.jpg"))

        url = _image_url(img, preset=ImagePresetEnum.MD)
        self.assertEqual(url, "https://cdn/fallback.jpg")

    @override_switch(IMGPROXY_SWITCH, active=True)
    def test_url_falls_back_when_no_processing(self) -> None:
        img = self._make_image_type(self._make_file(url="https://cdn/photo.jpg"))

        url = _image_url(img)
        self.assertEqual(url, "https://cdn/photo.jpg")

    def test_url_returns_empty_string_when_file_url_raises(self) -> None:
        file = MagicMock()
        file.__bool__ = lambda self: True
        type(file).url = property(lambda self: (_ for _ in ()).throw(Exception("broken")))
        img = self._make_image_type(file)

        self.assertEqual(_image_url(img), "")

    def test_url_returns_empty_string_when_no_file(self) -> None:
        img = BaImageType(name="", _file=None)  # type: ignore[arg-type]
        self.assertEqual(_image_url(img), "")


class ResolveImageTest(TestCase):
    def test_returns_none_for_falsy_file(self) -> None:
        self.assertIsNone(resolve_image(None))  # type: ignore[arg-type]
        self.assertIsNone(resolve_image(""))  # type: ignore[arg-type]

    def test_returns_image_type_for_valid_file(self) -> None:
        file = SimpleNamespace(name="photo.jpg", path="/media/photo.jpg", size=1024, width=800, height=600)
        result = resolve_image(file)  # type: ignore[arg-type]
        self.assertIsNotNone(result)
        self.assertEqual(result.name, "photo.jpg")  # type: ignore[union-attr]
        self.assertEqual(result.size, 1024)  # type: ignore[union-attr]
        self.assertEqual(result.width, 800)  # type: ignore[union-attr]
        self.assertEqual(result.height, 600)  # type: ignore[union-attr]

    def test_handles_missing_optional_attrs(self) -> None:
        file = SimpleNamespace(name="doc.pdf")
        result = resolve_image(file)  # type: ignore[arg-type]
        self.assertIsNotNone(result)
        self.assertEqual(result.name, "doc.pdf")  # type: ignore[union-attr]
        self.assertEqual(result.size, 0)  # type: ignore[union-attr]
