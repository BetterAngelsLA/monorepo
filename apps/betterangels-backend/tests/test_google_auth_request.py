import vcr
from django.test import Client, TestCase


class GoogleAuthTestCase(TestCase):
    @vcr.use_cassette("tests/cassettes/google_auth_call_valid_token.yaml")
    def test_google_auth_call_invalid_token(self) -> None:
        client = Client()
        code = (
            "4/0AfJohXlDGMj4l4dgmRhM9IHSGpUdYqzux8f9vT3AIgxC2c52oXUQKZ8xdmaSOhwPNhnfBA"
        )
        code_verifier = "uKzvSFmSLRvtkyi7GOEOCfSqir8rsPHEdzlz0fnTynPdjo0osS5GsORJoj4aFYRjtNISDPbvRJeS4Q7BLvvjP4PZ127KfSoTwjrUMfA47xgZ3UHVSpczS8fe3lAehdUN"

        final_response = client.post(
            "/rest-auth/google/?redirect_uri=http%3A%2F%2Flocalhost%3A8081",
            content_type="application/json",
            data={
                "code": code,
                "code_verifier": code_verifier,
            },
        )
        assert final_response.status_code == 204
