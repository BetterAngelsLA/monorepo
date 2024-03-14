from django.contrib import admin

from .models import Shelter, Service, Population, Requirement, \
    ShelterType


class ShelterAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'shelter_type', 'email', 'phone',
                       'website'),
        }),
        ('Details', {
            'fields': ('services', 'requirements', 'population', 'max_stay',
                       'how_to_enter', 'description', 'bed_layout_description',
                       'typical_stay_description', 'total_beds', 'private_beds',
                       'average_bed_rate',)
        }),
        ('Other Information', {
            'fields': ('image_url',)
        }),
    )

    list_display = ('title',)
    search_fields = ('title',)


admin.site.register(ShelterType)
admin.site.register(Requirement)
admin.site.register(Population)
admin.site.register(Service)
admin.site.register(Shelter, ShelterAdmin)
