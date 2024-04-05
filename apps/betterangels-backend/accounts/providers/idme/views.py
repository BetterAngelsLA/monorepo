from typing import Any

import requests
from allauth.socialaccount.models import SocialApp, SocialLogin, SocialToken
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2Adapter,
    OAuth2CallbackView,
    OAuth2LoginView,
)
from django.conf import settings
from rest_framework.request import Request

from .provider import IdmeProvider


class IdMeOAuth2Adapter(OAuth2Adapter):
    provider_id = IdmeProvider.id
    access_token_url = f"{settings.SOCIALACCOUNT_IDME_BASE_URL}/oauth/token"
    authorize_url = f"{settings.SOCIALACCOUNT_IDME_BASE_URL}/oauth/authorize"
    profile_url = f"{settings.SOCIALACCOUNT_IDME_BASE_URL}/api/public/v3/attributes.json"

    def complete_login(self, request: Request, app: SocialApp, token: SocialToken, **kwargs: Any) -> SocialLogin:
        resp = requests.get(
            self.profile_url,
            headers={"Authorization": f"Bearer {token.token}"},
        )

        extra_data = resp.json()
        return self.get_provider().sociallogin_from_response(request, extra_data)


oauth2_login = OAuth2LoginView.adapter_view(IdMeOAuth2Adapter)
oauth2_callback = OAuth2CallbackView.adapter_view(IdMeOAuth2Adapter)
