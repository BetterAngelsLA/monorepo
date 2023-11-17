import vcr
from django.test import Client, TestCase


class DjRestAuthTestCase(TestCase):
    @vcr.use_cassette("accounts/tests/cassettes/google_pcke_authentication_flow.yaml")
    def test_google_pcke_authentication_flow(self) -> None:
        client = Client()
        code = (
            "4/0AfJohXlMiYtJqgYn1vPaxFHTBwVC6fUr9SlqTOZPOHszgKlyx9dcQMP7C8yIkmi2WnS5gA"
        )
        code_verifier = "7VGpxs4u64mTyhh719aji60LwPOSn48dDUi4KmkrwcDC9CEuLM23aSOWf2tEmmNmK9fASrMp8o9Rx9LRkBEVvHIBk0HYItZiN6XSwKEnEXAFfI69dpF0M7JyAVU4QFOD"

        final_response = client.post(
            "/rest-auth/google/?redirect_uri=http%3A%2F%2Flocalhost%3A8081",
            content_type="application/json",
            data={
                "code": code,
                "code_verifier": code_verifier,
            },
        )
        assert final_response.status_code == 204
