from allauth.socialaccount.providers.oauth2.urls import default_urlpatterns

from .provider import IdmeProvider

urlpatterns = default_urlpatterns(IdmeProvider)
