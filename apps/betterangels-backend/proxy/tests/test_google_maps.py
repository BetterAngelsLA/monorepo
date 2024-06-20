import json
from typing import Any
from unittest.mock import Mock, patch

from accounts.models import User
from django.test import Client, TestCase
from django.urls import reverse
from model_bakery import baker


class GoogleMapsApiViewTest(TestCase):

    def setUp(self) -> None:
        self.client = Client()
        self.user = baker.make(User)
        self.path = "geocode/json"

    @patch("requests.get")
    @patch("django.conf.settings.GOOGLE_MAPS_API_KEY", "fake_api_key")
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
