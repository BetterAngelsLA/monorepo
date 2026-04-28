from common.services.upload_token import TTL_GRACE_PERIOD_SECONDS, _signer, create_upload_token, validate_upload_token
from django.test import SimpleTestCase


class CreateUploadTokenTests(SimpleTestCase):
    def test_returns_token_string(self) -> None:
        token = create_upload_token(
            key="uploads/photo.jpg",
            user_id=1,
            scope="attachment",
            expires_in_seconds=300,
        )
        self.assertIsInstance(token, str)
        self.assertTrue(len(token) > 0)

    def test_token_contains_expected_payload(self) -> None:
        token = create_upload_token(
            key="uploads/photo.jpg",
            user_id=42,
            scope="avatar",
            expires_in_seconds=600,
        )
        payload = _signer.unsign_object(token)

        self.assertEqual(payload["key"], "uploads/photo.jpg")
        self.assertEqual(payload["user_id"], 42)
        self.assertEqual(payload["scope"], "avatar")
        self.assertEqual(payload["max_age"], 600 + TTL_GRACE_PERIOD_SECONDS)

    def test_generates_different_tokens_for_different_inputs(self) -> None:
        token1 = create_upload_token(
            key="uploads/photo1.jpg",
            user_id=1,
            scope="attachment",
            expires_in_seconds=300,
        )
        token2 = create_upload_token(
            key="uploads/photo2.jpg",
            user_id=1,
            scope="attachment",
            expires_in_seconds=300,
        )
        self.assertNotEqual(token1, token2)


class ValidateUploadTokenTests(SimpleTestCase):
    def setUp(self) -> None:
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

    def test_token_can_be_validated_multiple_times(self) -> None:
        for _ in range(3):
            result = validate_upload_token(
                upload_token=self.token,
                key=self.key,
                user_id=self.user_id,
                scope=self.scope,
            )
            self.assertTrue(result)

    def test_invalid_token(self) -> None:
        result = validate_upload_token(
            upload_token="nonexistent-token",
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertFalse(result)

    def test_tampered_token(self) -> None:
        result = validate_upload_token(
            upload_token=self.token + "tampered",
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

    def test_expired_token(self) -> None:
        # Create a token with max_age=0 (immediately expired)
        token = create_upload_token(
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
            expires_in_seconds=-TTL_GRACE_PERIOD_SECONDS,
        )

        result = validate_upload_token(
            upload_token=token,
            key=self.key,
            user_id=self.user_id,
            scope=self.scope,
        )
        self.assertFalse(result)
