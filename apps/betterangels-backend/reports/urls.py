"""Reports app URL configuration."""

from django.urls import path

from .views import export_interaction_data

app_name = "reports"

urlpatterns = [
    path("export/", export_interaction_data, name="export_interaction_data"),
]
