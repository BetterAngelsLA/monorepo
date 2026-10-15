from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from model_bakery import baker
from regions.models import Region, RegionKind
from regions.tiles import MVT_CONTENT_TYPE
from django.contrib.gis.geos import MultiPolygon, Polygon

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
        self.assertEqual(response["Content-Type"], MVT_CONTENT_TYPE)
        self.assertGreater(len(response.content), 0)
        self.assertIn(b"regions", response.content[:64], "the layer name is in the tile header")

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
