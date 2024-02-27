from django.contrib import admin

from .models import Shelter, Location, Service, Population, Requirement


class ShelterAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'email', 'phone', 'website', 'location'),
        }),
        ('Details', {
            'fields': ('services', 'requirements', 'population', 'max_stay',
                       'how_to_enter', 'description', 'bed_layout_description', 'typical_stay_description')
        }),
        ('Other Information', {
            'fields': ('image_url',)
        }),
    )

    list_display = ('title',)
    search_fields = ('title',)


admin.site.register(Requirement)
admin.site.register(Population)
admin.site.register(Service)
admin.site.register(Shelter, ShelterAdmin)
admin.site.register(Location)
