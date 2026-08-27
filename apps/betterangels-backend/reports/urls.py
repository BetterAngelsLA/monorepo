"""Reports app URL configuration."""

from django.urls import path

from .views import ExportInteractionDataApi, ShelterMetricsExportApi

app_name = "reports"

urlpatterns = [
    path("export/", ExportInteractionDataApi.as_view(), name="export_interaction_data"),
    path(
        "shelters/<str:shelter_id>/export/",
        ShelterMetricsExportApi.as_view(),
        name="export_shelter_metrics",
    ),
]
