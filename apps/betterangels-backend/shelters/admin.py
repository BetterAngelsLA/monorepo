from django.contrib import admin

from .models import Shelter, Service, Population, Requirement, \
    ShelterType


class ShelterAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'shelter_type', 'email', 'phone',
                       'website', 'image_url'),
        }),
        ('Location', {
            'fields': ('address', 'city', 'state', 'zip_code', 'confidential', 'spa',
                       'latitude', 'longitude')
        }),
        ('Criteria', {
            'fields': ('services', 'requirements', 'population',)
        }),
        ('Beds', {
            'fields': ('total_beds', 'private_beds', 'average_bed_rate',
                       'bed_layout_description')
        }),
        ('Other Details', {
            'fields': ('max_stay', 'how_to_enter', 'description',
                       'typical_stay_description',)
        })
    )

    list_display = ('title',)
    search_fields = ('title',)


admin.site.register(ShelterType)
admin.site.register(Requirement)
admin.site.register(Population)
admin.site.register(Service)
admin.site.register(Shelter, ShelterAdmin)
