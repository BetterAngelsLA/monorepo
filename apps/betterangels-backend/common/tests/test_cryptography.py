import datetime

from botocore.signers import CloudFrontSigner
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from django.test import TestCase


class CloudFrontSigningCryptographyTest(TestCase):
    """
    Regression test validating CloudFront URL signing logic using dynamically generated keys.
    """

    def test_generate_signed_url_with_dynamic_key(self) -> None:
        key_id: str = "DUMMY_TEST_KEY_ID"
        url: str = "https://example.cloudfront.net/test-file.jpg"
        expire_date: datetime.datetime = datetime.datetime.utcnow() + datetime.timedelta(minutes=30)

        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )

        def rsa_signer(message: bytes) -> bytes:
            return private_key.sign(
                message,
                padding.PKCS1v15(),
                hashes.SHA1(),
            )

        signer: CloudFrontSigner = CloudFrontSigner(key_id, rsa_signer)
        signed_url: str = signer.generate_presigned_url(url, date_less_than=expire_date)

        self.assertIn("Expires", signed_url)
        self.assertIn("Signature", signed_url)
        self.assertIn(f"Key-Pair-Id={key_id}", signed_url)
