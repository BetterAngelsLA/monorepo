"""Regions app URL configuration."""

from django.urls import path

from .views import DensityTileView, RegionTileView

app_name = "regions"

urlpatterns = [
    # Registered **before** the ``<str:kind>`` route, and the order is load-bearing rather than
    # conventional. The two templates are the same four segments once ``density`` is read as a
    # kind, so ``reverse("regions:region_density_tile", …)`` and
    # ``reverse("regions:region_tile", kwargs={"kind": "density", …})`` build the **same** path
    # — ``test_density_tiles`` pins that equality. The literal therefore has to match first, and
    # this ordering is the only thing that decides which view a density tile reaches.
    path(
        "tiles/density/<int:z>/<int:x>/<int:y>.mvt",
        DensityTileView.as_view(),
        name="region_density_tile",
    ),
    path(
        "tiles/<str:kind>/<int:z>/<int:x>/<int:y>.mvt",
        RegionTileView.as_view(),
        name="region_tile",
    ),
]
