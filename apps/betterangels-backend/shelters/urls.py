"""Shelters app URL configuration."""

from django.urls import path

from .views import ShelterMetricsExportApi

app_name = "shelters"

urlpatterns = [
    path("<str:shelter_id>/export/", ShelterMetricsExportApi.as_view(), name="export_shelter_metrics"),
]
