from django.urls import path

from .views import google_maps_api, google_places_api

urlpatterns = [
    path("maps/api/<path:path>/", google_maps_api, name="google_maps_api"),
    path("places/v1/places:<str:action>/", google_places_api, name="google_places_api"),
]
