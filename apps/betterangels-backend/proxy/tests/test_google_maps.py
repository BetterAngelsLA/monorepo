import json
from typing import Any
from unittest.mock import Mock, patch

from accounts.models import User
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from model_bakery import baker


class GoogleMapsApiViewTestCase(TestCase):

    def setUp(self) -> None:
        self.client = Client()
        self.user = baker.make(User)
        self.path = "geocode/json"

    @patch("requests.get")
    @override_settings(GOOGLE_MAPS_API_KEY="fake_api_key")
    def test_google_maps_api_view(self, mock_get: Any) -> None:
        # Basically a smoke test for this proxy
        self.client.force_login(self.user)
        url = reverse("google_maps_api", args=[self.path]) + "?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA"

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "results": [{"formatted_address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA"}],
            "status": "OK",
        }
        mock_get.return_value = mock_response

        response = self.client.get(url)

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content.decode("utf-8"), json.dumps(mock_response.json.return_value))


class GooglePlacesApiNewViewTestCase(TestCase):

    def setUp(self) -> None:
        self.client = Client()
        self.user = baker.make(User)

    @patch("requests.post")
    @override_settings(GOOGLE_MAPS_API_KEY="fake_api_key")
    def test_google_places_api_autocomplete(self, mock_post: Any) -> None:
        self.client.force_login(self.user)
        url = reverse("google_places_api", args=["places:autocomplete"])

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "suggestions": [
                {
                    "placePrediction": {
                        "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
                        "structuredFormat": {
                            "mainText": {"text": "Sydney Opera House"},
                            "secondaryText": {"text": "Sydney NSW, Australia"},
                        },
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        response = self.client.post(
            url,
            data=json.dumps({"input": "Sydney Opera"}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content.decode("utf-8"), json.dumps(mock_response.json.return_value))

        # Verify the API key was passed in headers
        call_args = mock_post.call_args
        self.assertEqual(call_args[1]["headers"]["X-Goog-Api-Key"], "fake_api_key")

    def test_google_places_api_requires_post(self) -> None:
        self.client.force_login(self.user)
        url = reverse("google_places_api", args=["places:autocomplete"])

        response = self.client.put(url)

        self.assertEqual(response.status_code, 405)

    def test_google_places_api_requires_authentication(self) -> None:
        url = reverse("google_places_api", args=["places:autocomplete"])

        response = self.client.post(
            url,
            data=json.dumps({"input": "test"}),
            content_type="application/json",
        )

        # Should redirect to login
        self.assertEqual(response.status_code, 302)
