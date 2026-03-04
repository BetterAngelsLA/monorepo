"""Reports app URL configuration."""

from django.urls import path

from .views import ExportInteractionDataApi

app_name = "reports"

urlpatterns = [
    path("export/", ExportInteractionDataApi.as_view(), name="export_interaction_data"),
]
