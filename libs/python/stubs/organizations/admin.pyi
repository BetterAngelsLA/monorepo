from _typeshed import Incomplete
from django.contrib import admin
from organizations import models as models
from organizations.base_admin import BaseOrganizationAdmin as BaseOrganizationAdmin, BaseOrganizationOwnerAdmin as BaseOrganizationOwnerAdmin, BaseOrganizationUserAdmin as BaseOrganizationUserAdmin, BaseOwnerInline as BaseOwnerInline

class OwnerInline(BaseOwnerInline):
    model = models.OrganizationOwner

class OrganizationAdmin(BaseOrganizationAdmin):
    inlines: Incomplete

class OrganizationUserAdmin(BaseOrganizationUserAdmin): ...
class OrganizationOwnerAdmin(BaseOrganizationOwnerAdmin): ...
class OrganizationInvitationAdmin(admin.ModelAdmin): ...
