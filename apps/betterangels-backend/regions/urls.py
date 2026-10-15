"""Regions app URL configuration."""

from django.urls import path

from .views import RegionTileView

app_name = "regions"

urlpatterns = [
    path(
        "tiles/<str:kind>/<int:z>/<int:x>/<int:y>.mvt",
        RegionTileView.as_view(),
        name="region_tile",
    ),
]
