from .models import SocialAccount as SocialAccount, SocialApp as SocialApp, SocialToken as SocialToken
from _typeshed import Incomplete
from allauth import app_settings as app_settings
from allauth.account.adapter import get_adapter as get_adapter
from django import forms
from django.contrib import admin

class SocialAppForm(forms.ModelForm):
    class Meta:
        model = SocialApp
        exclude: Incomplete
        widgets: Incomplete

class SocialAppAdmin(admin.ModelAdmin):
    form = SocialAppForm
    list_display: Incomplete
    filter_horizontal: Incomplete

class SocialAccountAdmin(admin.ModelAdmin):
    search_fields: Incomplete
    raw_id_fields: Incomplete
    list_display: Incomplete
    list_filter: Incomplete
    def get_search_fields(self, request): ...

class SocialTokenAdmin(admin.ModelAdmin):
    raw_id_fields: Incomplete
    list_display: Incomplete
    list_filter: Incomplete
    def truncated_token(self, token): ...
