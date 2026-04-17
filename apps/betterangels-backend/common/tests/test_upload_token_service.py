from unittest.mock import patch

from common.services.upload_token import (
    TTL_GRACE_PERIOD_SECONDS,
    UPLOAD_TOKEN_PREFIX,
    create_upload_token,
    validate_upload_token,
)
from django.core.cache import cache
from django.test import SimpleTestCase, override_settings

LOC_MEM = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "upload-token-tests",
    }
}


@override_settings(CACHES=LOC_MEM)
class CreateUploadTokenTests(SimpleTestCase):
    def setUp(self) -> None:
        cache.clear()

    def test_returns_token_string(self) -> None:
        token = create_upload_token(
            key="uploads/photo.jpg",
            user_id=1,
            scope="attachment",
            expires_in_seconds=300,
        )
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 0)

    def test_stores_payload_in_cache(self) -> None:
        token = create_upload_token(
            key="uploads/photo.jpg",
            user_id=42,
            scope="avatar",
            expires_in_seconds=600,
        )
        cache_key = f"{UPLOAD_TOKEN_PREFIX}{token}"
        stored = cache.get(cache_key)

        self.assertIsNotNone(stored)
        self.assertEqual(stored["key"], "uploads/photo.jpg")
        self.assertEqual(stored["user_id"], 42)
        self.assertEqual(stored["scope"], "avatar")

    def test_cache_ttl_includes_grace_period(self) -> None:
        expires_in = 300
        with patch.object(cache, "set", wraps=cache.set) as mock_set:
            create_upload_token(
                key="uploads/photo.jpg",
                user_id=1,
                scope="attachment",
                expires_in_seconds=expires_in,
            )
            mock_set.assert_called_once()
            _, kwargs = mock_set.call_args
            if "timeout" in kwargs:
                self.assertEqual(kwargs["timeout"], expires_in + TTL_GRACE_PERIOD_SECONDS)
            else:
                # timeout passed as positional arg
                args = mock_set.call_args[0]
                self.assertEqual(args[2], expires_in + TTL_GRACE_PERIOD_SECONDS)

    def test_generates_unique_tokens(self) -> None:
        tokens = {
            create_upload_token(
                key="uploads/photo.jpg",
                user_id=1,
                scope="attachment",
                expires_in_seconds=300,
            )
            for _ in range(20)
        }
        self.assertEqual(len(tokens), 20)


@override_settings(CACHES=LOC_MEM)
class ValidateUploadTokenTests(SimpleTestCase):
    def setUp(self) -> None:
        cache.clear()
        self.key = "uploads/photo.jpg"
        self.user_id = 42
        self.scope = "attachment"
        self.token = create_upload_token(
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
            expires_in_seconds=300,
        )

    def test_valid_token(self) -> None:
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertTrue(result)

    def test_token_is_consumed_after_use(self) -> None:
        first_result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertTrue(first_result)

        repeat_result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertFalse(repeat_result)

    def test_invalid_token(self) -> None:
        result = validate_upload_token(
            upload_token="nonexistent-token",
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertFalse(result)

    def test_wrong_key(self) -> None:
        result = validate_upload_token(
            upload_token=self.token,
            key="uploads/wrong.jpg",
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertFalse(result)

    def test_wrong_user_id(self) -> None:
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=999,
            scope=self.scope,
        )
        self.assertFalse(result)

    def test_wrong_scope(self) -> None:
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope="wrong-scope",
        )
        self.assertFalse(result)

    def test_wrong_key_does_not_consume_token(self) -> None:
        validate_upload_token(
            upload_token=self.token,
            key="uploads/wrong.jpg",
            user_id=self.user_id,
            scope=self.scope,
        )
        # Token should still be valid with correct params
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertTrue(result)

    def test_wrong_user_id_does_not_consume_token(self) -> None:
        validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=999,
            scope=self.scope,
        )
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertTrue(result)

    def test_wrong_scope_does_not_consume_token(self) -> None:
        validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope="wrong-scope",
        )
        result = validate_upload_token(
            upload_token=self.token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertTrue(result)
