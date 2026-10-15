"""Regions app URL configuration."""

from django.urls import path

from .views import DensityTileView, RegionTileView

app_name = "regions"

urlpatterns = [
    # Registered **before** the ``<str:kind>`` route, and deliberately. The two cannot actually
    # collide — the boundary pattern wants an extra ``<int>`` segment, so ``density/9/87/204``
    # cannot match it — but "the literal comes first" is the rule that stays true if either
    # pattern is ever changed, and the order is what an error message points at.
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
