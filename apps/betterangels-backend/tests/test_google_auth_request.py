import pytest
import requests
from conftest import my_vcr
from django.test import Client


@pytest.mark.django_db
@my_vcr.use_cassette("tests/cassettes/google_auth_call_invalid_token.yaml")
def test_google_auth_call_invalid_token():
    client = Client()

    # mock_google_token = "TOKEN"
    response = client.post(
        "/rest-auth/google/?redirect_uri=http%3A%2F%2Flocalhost%3A8081",
        content_type="application/json",
    )
    print("<<<<<<")
    print(response.content)
    assert response.status_code == 200
