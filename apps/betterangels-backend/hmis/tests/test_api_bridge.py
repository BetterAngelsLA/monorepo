from types import SimpleNamespace
from typing import cast

from django.test import RequestFactory, TestCase, override_settings
from strawberry.types import Info

from hmis.api_bridge import HmisApiBridge

DEFAULT_ENDPOINT = "https://betterangels-sandbox.example.com"
HMIS_HOST = "api.example.com"


def _make_info() -> Info:
    """Minimal ``strawberry.Info`` whose context carries a real Django request."""
    request = RequestFactory().post("/graphql")
    return cast(Info, SimpleNamespace(context={"request": request}))


@override_settings(HMIS_REST_URL=DEFAULT_ENDPOINT, HMIS_HOST=HMIS_HOST)
class HmisApiBridgeEndpointTestCase(TestCase):
    """Endpoint selection in ``HmisApiBridge.__init__``."""

    def test_defaults_to_hmis_rest_url(self) -> None:
        bridge = HmisApiBridge(info=_make_info())

        self.assertEqual(bridge.endpoint, DEFAULT_ENDPOINT)
        self.assertEqual(bridge.headers["Host"], HMIS_HOST)

    def test_raises_when_no_endpoint_is_configured(self) -> None:
        with override_settings(HMIS_REST_URL=None):
            with self.assertRaisesMessage(Exception, "HMIS_REST_URL and HMIS_HOST must be configured"):
                HmisApiBridge(info=_make_info())
