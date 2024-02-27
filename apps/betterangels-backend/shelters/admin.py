from django.contrib import admin

from .models import Shelter, Location, Service


admin.site.register(Service)
admin.site.register(Shelter)
admin.site.register(Location)
