import json
from typing import Any, List, Type, TypeVar, cast
from urllib.parse import unquote

from accounts.serializers import SocialLoginSerializer
from allauth.socialaccount.providers.apple.client import AppleOAuth2Client
from allauth.socialaccount.providers.apple.views import AppleOAuth2Adapter
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .utils import base64url_decode

T = TypeVar("T")


def scope_fix(client_class: Type[Any]) -> Type[Any]:
    # https://github.com/iMerica/dj-rest-auth/issues/673
    class Wrapped(client_class):
        def __init__(
            self,
            request: Any,
            consumer_key: str,
            consumer_secret: str,
            access_token_method: str,
            access_token_url: str,
            callback_url: str,
            _scope: Any,  # Extra parameter to ignore
            scope_delimiter: str = " ",
            headers: Any = None,
            basic_auth: bool = False,
            **kwargs: Any,
        ) -> None:
            # _scope is accepted but ignored.
            super().__init__(
                request,
                consumer_key,
                consumer_secret,
                access_token_method,
                access_token_url,
                callback_url,
                scope_delimiter,
                headers,
                basic_auth,
                **kwargs,
            )

    return Wrapped


class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = scope_fix(AppleOAuth2Client)
    serializer_class = SocialLoginSerializer
    authentication_classes: List[Any] = []


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = scope_fix(OAuth2Client)
    serializer_class = SocialLoginSerializer
    authentication_classes: List[Any] = []

    def post(self, request: Request, *args: T, **kwargs: Any) -> Response:
        # Get callback_url URL parameters
        self.callback_url = request.query_params.get("redirect_uri")
        return cast(Response, super().post(request, *args, **kwargs))


class AuthRedirectView(APIView):
    def get(self, request: Request) -> Response:
        state_param = request.query_params.get("state")
        if state_param:
            decoded_state = unquote(base64url_decode(state_param))
            state = json.loads(decoded_state)
        else:
            state = None
        redirect_uri = state.get("path_back")

        if not redirect_uri:
            # Handle the case where no redirect URI is provided.
            # Respond with an error or provide a default URI.
            return Response({"detail": "path_back not provided."}, status=400)

        # Forward the code (or error) to your app.
        # Assuming your app needs the code to obtain tokens.'
        if request.query_params:
            redirect_uri += "?"
            redirect_uri += "&".join(f"{key}={value}" for key, value in request.query_params.items())
        response = Response(status=302)  # 302 is for temporary redirect
        response["Location"] = redirect_uri
        return response
