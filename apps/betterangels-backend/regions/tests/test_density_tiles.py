"""The interaction-density tile (DEV-2570 / DEV-2604).

The tile is the same data ``interactionMap`` returns, aggregated into a grid rather than
shipped as points, so the tests here are about the two things that can go wrong when a
surface is *derived* from points instead of listing them:

* the derivation is wrong — a cell's ``count`` is not the number of interactions in it, or
  the grid does not follow the zoom;
* the derivation is a **leak** — a cell is emitted for an interaction the points query would
  have withheld, whether that is another organization's, another role's, or outside the date
  range.

Both gates on ``interactionMap`` are exercised, because they fail in opposite directions:
``ORG_ADMIN`` holds the report permission and no note permission, so a tile that checked only
one of them would return either everything or nothing.
"""

from __future__ import annotations

import math
from datetime import UTC, date, datetime
from typing import Any, Optional
from urllib.parse import urlencode

from django.contrib.gis.geos import MultiPolygon, Point, Polygon
from django.test import SimpleTestCase, TestCase
from django.urls import reverse
from django.utils import timezone
from model_bakery import baker

from accounts.groups import ORG_ADMIN
from accounts.models import User
from accounts.role_manager import OrgRoleManager
from accounts.services import sync_roles
from accounts.tests.baker_recipes import organization_recipe
from common.models import Location
from common.tests.utils import make_legacy_only_holder
from notes.groups import CASEWORKER
from notes.models import Note
from regions.models import Region, RegionKind
from regions.tiles import MVT_CONTENT_TYPE, density_cells_per_tile

from . import mvt

#: Web Mercator's half-width in metres, and the only constant the tile maths below needs.
_HALF_WORLD = 20037508.342789244

#: A tile with a cell size of ~507 m at z12, so points a cell apart land in different
#: cells. DTLA.
_LON, _LAT = -118.24, 34.05
_ZOOM = 12


def tile_for(lon: float, lat: float, zoom: int) -> tuple[int, int]:
    """The slippy-map tile containing a point — the inverse of the tile envelope."""
    count = 2**zoom
    x = int((lon + 180.0) / 360.0 * count)
    y = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * count)
    return x, y


def lonlat_for_cell(cell_x: int, cell_y: int, *, zoom: int, tile_x: int, tile_y: int) -> tuple[float, float]:
    """The centre of one grid cell of a tile, in degrees.

    The same arithmetic ``tiles._DENSITY_CELLS`` does — tile envelope, cell size, project the
    point — run backwards, so a fixture can name the cell it means instead of hoping a
    coordinate lands in the right one. Points are placed at cell *centres* precisely so no
    assertion depends on which side of a boundary a float rounds to.
    """
    world = 2 * _HALF_WORLD
    tile = world / 2**zoom
    size = tile / density_cells_per_tile(zoom)
    x0 = -_HALF_WORLD + tile_x * tile
    # Tile y counts **southward** from the top of the world while Mercator y counts northward,
    # so a tile's southern edge is `half - (y + 1) * tile`, not `-half + y * tile`.
    y0 = _HALF_WORLD - (tile_y + 1) * tile
    mercator_x = x0 + (cell_x + 0.5) * size
    mercator_y = y0 + (cell_y + 0.5) * size
    lon = mercator_x / world * 360.0
    lat = math.degrees(2 * math.atan(math.exp(mercator_y / (world / (2 * math.pi)))) - math.pi / 2)
    return lon, lat


class DensityCellsPerTileTestCase(SimpleTestCase):
    """The grid holds a ground size rather than a fixed fraction of the tile.

    The client's `densityCellsPerTile` mirrors this list; a change here without the client
    (or the reverse) would make the legend and the colours disagree.
    """

    def test_cells_hold_the_target_and_cap_at_the_county(self) -> None:
        self.assertEqual([density_cells_per_tile(z) for z in range(8, 17)], [64, 64, 64, 32, 16, 8, 4, 2, 1])


class DensityTileBaseTestCase(TestCase):
    """One organization, one reader who holds both gates, and a tile to put notes in."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.org = organization_recipe.make()
        self.other_org = organization_recipe.make()
        self.tile_x, self.tile_y = tile_for(_LON, _LAT, _ZOOM)
        self.start = date(2020, 1, 1)
        self.end = date(2020, 1, 31)
        self.when = datetime(2020, 1, 15, tzinfo=UTC)
        self.reader = self._both_gates(self.org)
        self.client.force_login(self.reader)

    def _both_gates(self, organization: Any) -> User:
        """A caseworker: legacy ``notes.view_note`` **and** a role-backed report grant.

        Built in that order deliberately — ``make_legacy_only_holder`` drops every Grant on
        the user, so the report grant has to be added after it or it is silently revoked.
        """
        user = make_legacy_only_holder(user=baker.make(User), organization=organization, template_name=CASEWORKER.name)
        OrgRoleManager(organization).add_roles(user, ORG_ADMIN)
        return user

    def _report_only(self, organization: Any) -> User:
        """``ORG_ADMIN`` with no note permission — the role the leak test is about."""
        user = baker.make(User)
        organization.add_user(user)
        OrgRoleManager(organization).add_roles(user, ORG_ADMIN)
        return user

    def _note_at(
        self,
        lon: float,
        lat: float,
        *,
        organization: Any = None,
        when: Optional[datetime] = None,
        located: bool = True,
        shared_location: Any = None,
    ) -> Note:
        if shared_location is not None:
            location = shared_location
        elif located:
            location = baker.make(Location, point=Point(lon, lat, srid=4326))
        else:
            location = None
        return baker.make(
            Note,
            organization=organization or self.org,
            interacted_at=when or self.when,
            location=location,
        )

    def _note_in_cell(self, cell_x: int, cell_y: int, **kwargs: Any) -> Note:
        lon, lat = lonlat_for_cell(cell_x, cell_y, zoom=_ZOOM, tile_x=self.tile_x, tile_y=self.tile_y)
        return self._note_at(lon, lat, **kwargs)

    def _url(
        self,
        *,
        z: Optional[int] = None,
        x: Optional[int] = None,
        y: Optional[int] = None,
        organization: Any = None,
        organization_id: Optional[str] = None,
        start: Any = "__default__",
        end: Any = "__default__",
        codes: Any = None,
        dimension: Optional[str] = None,
    ) -> str:
        path = reverse(
            "regions:region_density_tile",
            kwargs={
                "z": _ZOOM if z is None else z,
                "x": self.tile_x if x is None else x,
                "y": self.tile_y if y is None else y,
            },
        )
        resolved = organization_id if organization_id is not None else str((organization or self.org).pk)
        # `org_id`, not `organizationId`: this is an HTTP query parameter read by
        # `reports.permissions.HasReportAccess`, and it is deliberately the same name the CSV
        # export uses. The GraphQL surfaces take `organizationId` instead.
        query: dict[str, Any] = {"org_id": resolved}
        if start != "omit":
            query["start"] = self.start.isoformat() if start == "__default__" else start
        if end != "omit":
            query["end"] = self.end.isoformat() if end == "__default__" else end
        if dimension is not None:
            query["dimension"] = dimension
        if codes is not None:
            query["codes"] = codes
        # `doseq` so a list of codes becomes repeated parameters, the way the map builds the
        # URL. An empty string stays one empty parameter, which is the "no codes" request.
        return f"{path}?{urlencode(query, doseq=True)}"

    def _counts(self, response: Any) -> list[int]:
        """Every cell's ``count``, sorted. An empty tile is an empty list, not an error."""
        self.assertEqual(response.status_code, 200, response.content[:200])
        cells = mvt.decode(response.content)
        self.assertEqual(list(cells), ["density"], "the tile must carry exactly the density layer")
        return sorted(int(feature["count"]) for feature in cells["density"])


class DensityTileContentTestCase(DensityTileBaseTestCase):
    """What the grid contains: one row per non-empty cell, carrying its count."""

    def test_a_cell_counts_the_interactions_in_it(self) -> None:
        """Two in one cell, one in each of two others — so a per-cell count, not a total."""
        self._note_in_cell(10, 10)
        self._note_in_cell(10, 10)
        self._note_in_cell(12, 12)
        self._note_in_cell(5, 4)

        counts = self._counts(self.client.get(self._url()))

        # The multiset, not just the sum: three cells of one and one cell of two is a grid;
        # four cells of one would be the same total and would mean the grouping was lost.
        self.assertEqual(counts, [1, 1, 2])
        self.assertEqual(sum(counts), 4, "every located interaction in range must be in exactly one cell")

    def test_two_interactions_at_one_location_count_twice(self) -> None:
        """A cell counts **interactions**, not the distinct places they happened.

        Notes share a location in the real data — a shelter is one point and many visits — so a
        grid that counted ``DISTINCT location_id`` would understate exactly the places the map
        is read for. The two notes below share one ``Location`` row, which is what makes this
        different from the test above.
        """
        lon, lat = lonlat_for_cell(10, 10, zoom=_ZOOM, tile_x=self.tile_x, tile_y=self.tile_y)
        shared = baker.make(Location, point=Point(lon, lat, srid=4326))
        self._note_at(lon, lat, shared_location=shared)
        self._note_at(lon, lat, shared_location=shared)

        self.assertEqual(self._counts(self.client.get(self._url())), [2])

    def test_an_interaction_without_a_location_is_not_counted(self) -> None:
        self._note_in_cell(10, 10)
        self._note_in_cell(10, 10, located=False)

        self.assertEqual(sum(self._counts(self.client.get(self._url()))), 1)

    def test_an_interaction_outside_the_tile_is_not_counted(self) -> None:
        """A tile is a window, not a filter that happens to be applied afterwards."""
        self._note_in_cell(10, 10)
        self._note_at(0.0, 0.0)

        self.assertEqual(sum(self._counts(self.client.get(self._url()))), 1)

    def test_the_grid_coarsens_with_the_zoom(self) -> None:
        """The same three points are three cells at z12 and one at z0.

        This is the property a fixed metre cell size would not have: a cell is a fraction of
        the tile, so zooming out merges cells instead of shrinking the polygons.
        """
        for cell in ((10, 10), (11, 11), (12, 12)):
            self._note_in_cell(*cell)

        self.assertEqual(self._counts(self.client.get(self._url())), [1, 1, 1])
        world = self._counts(self.client.get(self._url(z=0, x=0, y=0)))
        self.assertEqual(world, [3], "at z0 the whole world is one tile and the three points one cell")

    def test_an_empty_tile_is_204_not_an_empty_200(self) -> None:
        """deck.gl reads an empty body with a success status as a malformed tile."""
        # The middle of the Pacific at z4.
        response = self.client.get(self._url(z=4, x=2, y=8))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")

    def test_a_tile_with_no_interactions_is_204(self) -> None:
        self.assertEqual(self.client.get(self._url()).status_code, 204)

    def test_a_populated_tile_is_served_as_mvt(self) -> None:
        self._note_in_cell(10, 10)
        response = self.client.get(self._url())
        # The literal, not the imported constant: comparing against the module under test
        # means changing that module keeps this green.
        self.assertEqual(response["Content-Type"], "application/vnd.mapbox-vector-tile")
        self.assertEqual(MVT_CONTENT_TYPE, "application/vnd.mapbox-vector-tile")
        self.assertIn(b"density", response.content[:64], "the layer name is in the tile header")

    def test_a_cell_is_drawn_where_its_count_was_computed(self) -> None:
        """The polygon is rebuilt from the same origin and cell size the grouping used.

        Without this the *geometry* half of ``_DENSITY_ENCODE`` is unasserted: a flipped axis,
        an off-by-one cell, or a wrong origin would keep every count-based test green while
        moving every square off the ground it describes.
        """
        cell = (10, 10)
        self._note_in_cell(*cell)

        features = mvt.decode(self.client.get(self._url()).content)["density"]
        self.assertEqual(len(features), 1)
        rings = features[0][mvt.GEOMETRY]
        self.assertEqual(len(rings), 1, "a cell is one polygon ring")
        ring = rings[0]
        self.assertEqual(len(ring), 5, "a rectangle ring is four corners plus the closing point")
        self.assertEqual(ring[0], ring[-1], "the ring must be closed")

        # Tile-local units: a cell is the 4096-unit tile divided by the cells per tile, and the
        # y axis runs **southward** from the tile's top, so cell row `cy` sits at
        # `4096 - (cy + 1) * size … 4096 - cy * size`.
        size = 4096 // density_cells_per_tile(_ZOOM)
        xs = [point[0] for point in ring]
        ys = [point[1] for point in ring]
        self.assertEqual((min(xs), max(xs)), (cell[0] * size, (cell[0] + 1) * size))
        self.assertEqual((min(ys), max(ys)), (4096 - (cell[1] + 1) * size, 4096 - cell[1] * size))

    def test_the_density_tile_is_private_and_short_lived(self) -> None:
        """The response is per-org and per-permission, so no shared cache may keep it.

        The header is the only thing that says so: the URL carries the org and the range, so a
        cache keyed on it is exactly the wrong thing, and a longer lifetime than the boundary
        layer's would outlive the notes it aggregates.
        """
        self._note_in_cell(10, 10)
        response = self.client.get(self._url())
        self.assertIn("private", response["Cache-Control"])
        self.assertIn("max-age=60", response["Cache-Control"])

    def test_a_tile_outside_the_zooms_grid_is_404(self) -> None:
        # 2**2 == 4, so x=4 is out of range; z17 is past the ceiling.
        self.assertEqual(self.client.get(self._url(z=2, x=4, y=1)).status_code, 404)
        self.assertEqual(self.client.get(self._url(z=2, x=0, y=4)).status_code, 404)
        self.assertEqual(self.client.get(self._url(z=17, x=0, y=0)).status_code, 404)

    def test_the_density_route_is_not_swallowed_by_the_boundary_route(self) -> None:
        """The literal route wins, and it has to — the collision it wins is a real one.

        ``tiles/density/<z>/<x>/<y>.mvt`` is **exactly** what the boundary pattern
        ``tiles/<str:kind>/<z>/<x>/<y>.mvt`` matches with ``kind="density"``; the two templates
        are the same string once the literal is read as a kind. Registration order is therefore
        the only thing that decides, which is why `urls.py` puts the literal first and why this
        reverses both routes to prove the shapes coincide rather than asserting they do.

        The distinguisher is the **403**: a missing ``org_id`` is a density-view answer (the
        report permission refuses it), where the boundary view has no org parameter and would
        have said 404 (``density`` is not a ``RegionKind``).
        """
        path = reverse("regions:region_density_tile", kwargs={"z": _ZOOM, "x": self.tile_x, "y": self.tile_y})
        boundary_shaped = reverse(
            "regions:region_tile", kwargs={"kind": "density", "z": _ZOOM, "x": self.tile_x, "y": self.tile_y}
        )
        self.assertTrue(path.startswith("/regions/tiles/density/"))
        self.assertEqual(boundary_shaped, path, "the two templates must collide for this test to mean anything")

        self.assertEqual(self.client.get(path).status_code, 403)

        # And the boundary route is still reached for a real dimension.
        real = reverse(
            "regions:region_tile", kwargs={"kind": "council_district", "z": _ZOOM, "x": self.tile_x, "y": self.tile_y}
        )
        self.assertIn(self.client.get(real).status_code, (200, 204))


class DensityTileDateRangeTestCase(DensityTileBaseTestCase):
    """The range is honoured, and an omitted one means the same window ``interactionMap`` uses."""

    def setUp(self) -> None:
        super().setUp()
        self._note_in_cell(10, 10, when=datetime(2020, 1, 15, tzinfo=UTC))
        self._note_in_cell(12, 12, when=datetime(2020, 3, 15, tzinfo=UTC))

    def test_only_the_interactions_in_range_are_counted(self) -> None:
        self.assertEqual(sum(self._counts(self.client.get(self._url()))), 1)

    def test_a_range_covering_both_counts_both(self) -> None:
        response = self.client.get(self._url(start="2020-01-01", end="2020-03-31"))
        self.assertEqual(sum(self._counts(response)), 2)

    def test_an_omitted_range_defaults_to_the_organizations_current_month(self) -> None:
        """Not to "everything": the KPI row above the map is already a month.

        The January and March fixtures are outside the current month, so this asserts the
        default is applied — and would fail if an omitted range silently meant no filter.
        """
        self._note_in_cell(14, 14, when=timezone.now())
        response = self.client.get(self._url(start="omit", end="omit"))
        self.assertEqual(sum(self._counts(response)), 1)

    def test_a_malformed_date_is_refused_rather_than_ignored(self) -> None:
        """Ignoring it would widen the window to the default and serve other rows."""
        self.assertEqual(self.client.get(self._url(start="not-a-date")).status_code, 400)


class DensityTilePermissionTestCase(DensityTileBaseTestCase):
    """Both gates, and a refusal that is empty rather than absent."""

    def setUp(self) -> None:
        super().setUp()
        self._note_in_cell(10, 10)
        self._note_in_cell(12, 12, organization=self.other_org)

    def test_anonymous_is_denied(self) -> None:
        self.client.logout()
        self.assertIn(self.client.get(self._url()).status_code, (401, 403))

    def test_a_reader_with_both_gates_gets_cells(self) -> None:
        """The positive control: a suite of denials alone cannot tell a gate from a wall."""
        self.assertEqual(sum(self._counts(self.client.get(self._url()))), 1)

    def test_a_reader_without_the_report_permission_is_denied(self) -> None:
        outsider = baker.make(User)
        self.org.add_user(outsider)
        self.client.force_login(outsider)
        self.assertEqual(self.client.get(self._url()).status_code, 403)

    def test_the_report_gate_is_per_organization(self) -> None:
        response = self.client.get(self._url(organization=self.other_org))
        self.assertEqual(response.status_code, 403)

    def test_an_unknown_organization_fails_closed(self) -> None:
        response = self.client.get(self._url(organization_id="99999999"))
        self.assertEqual(response.status_code, 403)

    def test_a_report_only_role_gets_no_cells_at_all(self) -> None:
        """**The leak test.** ``ORG_ADMIN`` holds ``reports.view_reports`` and no
        ``notes.view_note``.

        The points query answers this role with an empty list, so the tile must answer with no
        cells. A tile that checked only the report permission would hand this role the
        coordinates the pins refuse it, aggregated into visible squares — which is the same
        disclosure with a step in between.
        """
        self.client.force_login(self._report_only(self.org))
        response = self.client.get(self._url())
        self.assertEqual(response.status_code, 204, response.content[:200])
        self.assertEqual(response.content, b"", "no cell may be drawn for a note the points query denies")

    def test_another_organizations_data_is_never_aggregated_in(self) -> None:
        """Org confinement is the SQL predicate, not the permission filter.

        ``filter_for_user`` is binary and has no organization notion, so a reader holding the
        note scope model-level would otherwise receive every tenant's cells in the window.
        """
        counts = self._counts(self.client.get(self._url()))
        self.assertEqual(counts, [1], "the other organization's interaction leaked into the grid")


class DensityTileRegionScopeTestCase(DensityTileBaseTestCase):
    """``dimension`` + ``codes`` narrow the cells; an empty code list matches nothing."""

    def setUp(self) -> None:
        super().setUp()
        # One region around the (10, 10) cell and one around (5, 4), well apart.
        self.near_cell, self.far_cell = (10, 10), (5, 4)
        self.near = self._region_around(self.near_cell, kind=RegionKind.COUNCIL_DISTRICT, code="1")
        self.far = self._region_around(self.far_cell, kind=RegionKind.COUNCIL_DISTRICT, code="2")
        # The same code in a different dimension: a filter that keyed on the code alone would
        # match this one too.
        self.same_code_other_kind = self._region_around(self.far_cell, kind=RegionKind.SPA, code="1")

        self._note_in_cell(*self.near_cell)
        self._note_in_cell(*self.far_cell)

    def _region_around(self, cell: tuple[int, int], *, kind: str, code: str) -> Region:
        lon, lat = lonlat_for_cell(cell[0], cell[1], zoom=_ZOOM, tile_x=self.tile_x, tile_y=self.tile_y)
        # ~220 m either way around the point; the cell is ~507 m, but only the point has to
        # fall inside the region for the filter to match.
        ring = [
            (lon - 0.002, lat - 0.002),
            (lon + 0.002, lat - 0.002),
            (lon + 0.002, lat + 0.002),
            (lon - 0.002, lat + 0.002),
            (lon - 0.002, lat - 0.002),
        ]
        return Region.objects.create(
            kind=kind, code=code, name=f"{kind} {code}", geom=MultiPolygon(Polygon(ring, srid=4326), srid=4326)
        )

    def test_codes_narrow_the_cells_to_that_region(self) -> None:
        near_only = self.client.get(self._url(dimension="council_district", codes=["1"]))
        far_only = self.client.get(self._url(dimension="council_district", codes=["2"]))

        self.assertEqual(self._counts(near_only), [1])
        self.assertEqual(self._counts(far_only), [1])
        # One cell each: a filter that matched neither, or both, would give 0 or 2.
        self.assertEqual(sum(self._counts(self.client.get(self._url()))), 2)

    def test_a_code_from_another_dimension_does_not_match(self) -> None:
        """Code "1" is a council district *and* an SPA here; only the named one is in scope."""
        response = self.client.get(self._url(dimension="council_district", codes=["1"]))
        # The SPA 1 region sits over the far cell, so accepting it would add a second cell.
        self.assertEqual(self._counts(response), [1])

    def test_an_empty_code_list_matches_nothing(self) -> None:
        """``?codes=`` is "no region", not "no filter" — the same reading as ``interactionMap``."""
        response = self.client.get(self._url(dimension="council_district", codes=""))
        self.assertEqual(response.status_code, 204)

    def test_an_empty_code_list_without_a_dimension_is_an_empty_map_not_a_400(self) -> None:
        """An empty list matches nothing in *any* dimension, so it needs no dimension.

        This is the shape that has to agree with ``interactionMap(regionCodes: [])``, which
        returns an empty map. Spelling it as "codes without a dimension" and refusing it would
        make the same request a 400 on one surface and an empty answer on the other.
        """
        response = self.client.get(self._url(codes=""))
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.content, b"")

    def test_a_dimension_without_codes_is_refused_rather_than_ignored(self) -> None:
        """A caller who named a dimension meant to narrow by it, so silence is not an option.

        ``code`` is the branchable part, in the vocabulary the GraphQL surface reports in
        ``extensions.errors[].errorCode``.
        """
        response = self.client.get(self._url(dimension="council_district"))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "DIMENSION_REQUIRES_REGION_CODES")

    def test_codes_without_a_dimension_are_refused(self) -> None:
        """A code cannot be resolved without one: "1" is three dimensions at once."""
        response = self.client.get(self._url(codes=["1"]))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "REGION_CODES_REQUIRE_DIMENSION")

    def test_an_unknown_dimension_is_refused(self) -> None:
        self.assertEqual(self.client.get(self._url(dimension="not_a_dimension", codes=["1"])).status_code, 400)

    def test_an_unknown_code_yields_an_empty_tile(self) -> None:
        response = self.client.get(self._url(dimension="council_district", codes=["does-not-exist"]))
        self.assertEqual(response.status_code, 204)

    def test_region_codes_and_the_date_range_both_apply(self) -> None:
        """Two predicates, both required — neither may be dropped when the other is given."""
        self._note_in_cell(*self.near_cell, when=datetime(2020, 3, 15, tzinfo=UTC))
        in_range = self.client.get(
            self._url(dimension="council_district", codes=["1"], start="2020-01-01", end="2020-01-31")
        )
        out_of_range = self.client.get(
            self._url(dimension="council_district", codes=["1"], start="2020-03-01", end="2020-03-31")
        )
        self.assertEqual(self._counts(in_range), [1])
        self.assertEqual(self._counts(out_of_range), [1])
