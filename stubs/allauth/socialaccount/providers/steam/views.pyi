from .provider import SteamOpenIDProvider as SteamOpenIDProvider
from _typeshed import Incomplete
from allauth.socialaccount.providers.openid.views import OpenIDCallbackView as OpenIDCallbackView, OpenIDLoginView as OpenIDLoginView

STEAM_OPENID_URL: str

class SteamOpenIDLoginView(OpenIDLoginView):
    provider = SteamOpenIDProvider
    def get_form(self): ...
    def get_callback_url(self): ...

class SteamOpenIDCallbackView(OpenIDCallbackView):
    provider = SteamOpenIDProvider

steam_login: Incomplete
steam_callback: Incomplete
