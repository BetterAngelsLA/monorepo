from django.contrib import admin

from .models import ClientProfile, HmisProfile


class HmisProfileInline(admin.TabularInline):
    model = HmisProfile
    extra = 1


class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ["id"]
    inlines = [
        # HmisProfileInline,
    ]

    # def name(self, obj: ClientProfile) -> str:
    #     return obj.user.full_name


admin.site.register(ClientProfile, ClientProfileAdmin)
