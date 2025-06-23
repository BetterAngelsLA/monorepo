from django.test import TestCase, override_settings
from storages.backends.s3boto3 import S3Boto3Storage

DUMMY_CLOUDFRONT_KEY_ID = "DUMMYKEYID123"
DUMMY_CLOUDFRONT_PRIVATE_KEY = """
-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCU2eFw4XOILlhHqPb7y06mUJ2BlRlSEuShbk6WRB77Xm6jB+Ay
N+z1GP6bs33AOcBej64ZR0OVHo9WFFXq3LKqjtpkI9PP9PBLjgpVq8PJYX8VDgTh
McwRu6uPYs5Hlq2zQJUEE8bHy2++qLnfDnS85PNu5ZMNWFNht4eyF+PwmQIDAQAB
AoGACY6z2vue32+aW3+N3D0Bn8wtUNSx+4MbCwJ6KUvWcW1uzSkETDUrEdG5B2ZO
/Li4kVnIY/cfb8O2kGBd4+an0hKY1Em/7kkv6bflFFdC9pRsqkFSZtK4xpE727B2
wDv82rej+xagQVKyoZnIzSO9NCd9r/XLNMsQTF9wmoFn5sECQQDRZb0sLKQIsItT
9cPzt6RenotKBrYG0PgZtF/r9M0BxggiJYWAOpi126DN14mWY7G7M8sqfvnOuh5d
sbRAzqYnAkEAtfqPcwQgqTHyXisvoTca0/UPPd6GWrN6XLUutvHFXZljydSPc7WO
S9j3I0FN5HTSa9OgmU3V1TZ/t3b34KurPwJASi8TD/1Yt8Nj+QDOxR9AWk0s57Ls
9gk+fEzM1tlJb+FqrD5Cx6T6ySLgG0zK776uDrZQueN2OOjzLRpx06vibQJBAK/1
c4lJ/266TdlCNs7Soo06Up+HMDA5hOJpip74jddgPv3kG0VN0yaBxw1+0ptJXkFG
ou45Nb7w8HNshGfodi8CQQC+vfit14ARKnVNVF0MRbWmtSpXGGwahNxWXu9KTmko
m0kMSANR9C+QnOvr9yIRNu+3TD6UTec8XXBHM9Su63T9
-----END RSA PRIVATE KEY-----
""".strip()


class CloudFrontSigningRegressionTest(TestCase):
    """
    Regression test ensuring CloudFront URL signing via django-storages remains functional.

    Ensures cryptography dependency and storage backend configurations remain valid.
    """

    @override_settings(
        AWS_CLOUDFRONT_KEY_ID=DUMMY_CLOUDFRONT_KEY_ID,
        AWS_CLOUDFRONT_KEY=DUMMY_CLOUDFRONT_PRIVATE_KEY,
        AWS_S3_CUSTOM_DOMAIN="example.cloudfront.net",
        AWS_QUERYSTRING_AUTH=True,
    )
    def test_cloudfront_url_signing(self) -> None:
        storage = S3Boto3Storage()

        test_file_name = "test-file.jpg"
        expiration_seconds = 30 * 60  # expire after 30 minutes (in seconds)

        signed_url = storage.url(test_file_name, expire=expiration_seconds)

        # Verify essential URL components
        self.assertIn("Expires", signed_url)
        self.assertIn("Signature", signed_url)
        self.assertIn(f"Key-Pair-Id={DUMMY_CLOUDFRONT_KEY_ID}", signed_url)
