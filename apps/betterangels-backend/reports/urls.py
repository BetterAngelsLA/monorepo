"""Reports app URL configuration."""

from django.urls import path

from .views import ExportInteractionDataView

app_name = "reports"

urlpatterns = [
    path("export/", ExportInteractionDataView.as_view(), name="export_interaction_data"),
]
