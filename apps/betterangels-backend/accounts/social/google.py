from typing import Any, Dict

from social_core.backends.google import BaseGoogleOAuth2API
from social_core.backends.oauth import BaseOAuth2


class GoogleOAuth2PKCE(BaseGoogleOAuth2API, BaseOAuth2):
    """Google OAuth2 authentication backend"""

    name = "google-oauth2-pkce"
    REDIRECT_STATE = False
    AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/auth"
    ACCESS_TOKEN_URL = "https://accounts.google.com/o/oauth2/token"
    ACCESS_TOKEN_METHOD = "POST"
    REVOKE_TOKEN_URL = "https://accounts.google.com/o/oauth2/revoke"
    REVOKE_TOKEN_METHOD = "GET"
    # The order of the default scope is important
    DEFAULT_SCOPE = ["openid", "email", "profile"]
    EXTRA_DATA = [
        ("refresh_token", "refresh_token", True),
        ("expires_in", "expires"),
        ("token_type", "token_type", True),
    ]

    def auth_complete_params(self, state: Any = None) -> Dict[str, Any]:
        params = super().auth_complete_params(state=state)
        params["code_verifier"] = self.data.get("code_verifier", "")
        return params
