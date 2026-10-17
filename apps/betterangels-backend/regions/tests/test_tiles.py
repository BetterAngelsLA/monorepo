from django.contrib.auth import get_user_model
from django.contrib.gis.geos import MultiPolygon, Polygon
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker

from regions.models import Region, RegionKind
from regions.tiles import MVT_CONTENT_TYPE
from regions.views import MAX_ZOOM

from . import mvt

# A polygon covering the DTLA tile at z10/175/408.
RING = [(-118.5, 34.0), (-118.2, 34.0), (-118.2, 34.2), (-118.5, 34.2), (-118.5, 34.0)]


class RegionTileViewTestCase(TestCase):
    def setUp(self) -> None:
        self.user = baker.make(get_user_model(), is_active=True)
        self.client.force_login(self.user)
        Region.objects.create(
            kind=RegionKind.COUNCIL_DISTRICT,
            code="1",
            name="District 1",
            geom=MultiPolygon(Polygon(RING, srid=4326), srid=4326),
        )

    def _url(self, kind: str = "council_district", z: int = 10, x: int = 175, y: int = 408) -> str:
        return reverse("regions:region_tile", kwargs={"kind": kind, "z": z, "x": x, "y": y})

    def test_anonymous_is_denied(self) -> None:
        self.client.logout()
        self.assertIn(self.client.get(self._url()).status_code, (401, 403))

    def test_a_populated_tile_is_served_as_mvt(self) -> None:
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 200)
        # The literal, not `MVT_CONTENT_TYPE`: comparing against the constant imported from
        # the module under test means changing the module to serve `application/json` keeps
        # this green — and the docstring in `tiles.py` says that exact mistake surfaces to the
        # client as deck.gl's "Unimplemented type: 4" rather than as anything readable.
        self.assertEqual(response["Content-Type"], "application/vnd.mapbox-vector-tile")
        self.assertEqual(MVT_CONTENT_TYPE, "application/vnd.mapbox-vector-tile")
        self.assertGreater(len(response.content), 0)
        self.assertIn(b"regions", response.content[:64], "the layer name is in the tile header")

    def test_the_tile_carries_the_regions_code_and_name_with_geometry(self) -> None:
        """The tile's payload contract is its *properties* plus a geometry, not just bytes.

        ``SELECT r.code, r.name`` is what the client labels a feature with; asserting only that
        the response is non-empty would let the property list be deleted with every test green,
        and asserting only the layer name would let the geometry be dropped.
        """
        features = mvt.decode(self.client.get(self._url()).content)["regions"]
        self.assertEqual(len(features), 1)

        feature = features[0]
        self.assertEqual(feature["code"], "1")
        self.assertEqual(feature["name"], "District 1")
        rings = feature[mvt.GEOMETRY]
        self.assertTrue(rings, "the feature carries no geometry")
        self.assertGreaterEqual(len(rings[0]), 4, "a clipped polygon ring is at least a triangle plus closure")
        self.assertEqual(rings[0][0], rings[0][-1], "the ring must be closed")

    def test_the_boundary_tile_is_marked_private(self) -> None:
        """`private` is the conservative choice for a response fetched with a session cookie.

        The bytes are identical for every reader, so `public` would not leak anything — but the
        endpoint sits behind an authenticated session, and this keeps an intermediary from
        storing a session-bearing response. Asserted so the header is not quietly dropped.
        """
        response = self.client.get(self._url())
        self.assertIn("private", response["Cache-Control"])
        self.assertIn("max-age=3600", response["Cache-Control"])

    def test_an_empty_tile_is_204_not_an_empty_200(self) -> None:
        """deck.gl reads an empty body with a success status as a malformed tile."""
        # The middle of the Pacific.
        response = self.client.get(self._url(z=4, x=2, y=8))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")

    def test_a_tile_outside_the_zooms_grid_is_404(self) -> None:
        # 2**2 == 4, so x=4 is out of range.
        self.assertEqual(self.client.get(self._url(z=2, x=4, y=1)).status_code, 404)
        self.assertEqual(self.client.get(self._url(z=2, x=0, y=4)).status_code, 404)

    def test_a_zoom_past_the_ceiling_is_404(self) -> None:
        self.assertEqual(self.client.get(self._url(z=17, x=0, y=0)).status_code, 404)

    def test_an_unknown_dimension_is_404(self) -> None:
        self.assertEqual(self.client.get(self._url(kind="not_a_dimension")).status_code, 404)

    def test_tiles_are_cacheable(self) -> None:
        response = self.client.get(self._url())
        self.assertIn("max-age", response["Cache-Control"])
        self.assertIn("private", response["Cache-Control"])


class ZoomCeilingTestCase(TestCase):
    """The ceiling the client assumes, pinned on the side that enforces it.

    ``DeckMapLayers.tsx`` stops asking at ``TILE_MAX_ZOOM``; this view answers 404 above
    ``MAX_ZOOM``. Raising one without the other makes the client request tiles that are
    refused, which looks like a broken map rather than a mismatched constant.
    """

    def test_the_ceiling_is_the_one_the_client_assumes(self) -> None:
        self.assertEqual(MAX_ZOOM, 16)

    def test_a_tile_at_the_ceiling_is_served_rather_than_refused(self) -> None:
        user = baker.make(get_user_model(), is_active=True)
        self.client.force_login(user)
        url = reverse("regions:region_tile", kwargs={"kind": "council_district", "z": MAX_ZOOM, "x": 0, "y": 0})
        # 204 is the empty tile; the assertion is that it is not the 404 for an out-of-range z.
        self.assertEqual(self.client.get(url).status_code, 204)
