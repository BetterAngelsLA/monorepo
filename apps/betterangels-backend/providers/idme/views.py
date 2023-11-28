import requests
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2Adapter,
    OAuth2CallbackView,
    OAuth2LoginView,
)

from .provider import IdmeProvider


class IdMeOAuth2Adapter(OAuth2Adapter):
    provider_id = IdmeProvider.id
    access_token_url = "https://api.id.me/oauth/token"
    authorize_url = "https://api.id.me/oauth/authorize"
    profile_url = "https://api.id.me/api/public/v3/attributes.json"

    def complete_login(self, request, app, token, **kwargs):
        resp = requests.get(self.profile_url, params={"access_token": token.token})
        extra_data = resp.json()
        return self.get_provider().sociallogin_from_response(request, extra_data)


oauth2_login = OAuth2LoginView.adapter_view(IdMeOAuth2Adapter)
oauth2_callback = OAuth2CallbackView.adapter_view(IdMeOAuth2Adapter)
