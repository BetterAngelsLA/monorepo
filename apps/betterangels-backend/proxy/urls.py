from django.urls import path

from .views import google_maps_api

urlpatterns = [
    path("maps/api/<path:path>/", google_maps_api, name="google_maps_api"),
]
