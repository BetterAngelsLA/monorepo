from _typeshed import Incomplete
from allauth.socialaccount.providers.oauth2.client import OAuth2Client as OAuth2Client, OAuth2Error as OAuth2Error

class WeixinOAuth2Client(OAuth2Client):
    def get_redirect_url(self, authorization_url, extra_params): ...
    def get_access_token(self, code, pkce_code_verifier: Incomplete | None = ...): ...
