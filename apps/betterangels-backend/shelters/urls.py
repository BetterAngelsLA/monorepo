from django.urls import path

from . import views

urlpatterns = [
    path("<int:shelter_id>/media/", views.create_shelter_media, name="shelter-media-create"),
]
