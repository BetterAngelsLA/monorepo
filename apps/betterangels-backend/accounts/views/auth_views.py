import json
from typing import Any, List, TypeVar, cast
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


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    serializer_class = SocialLoginSerializer
    authentication_classes: List[Any] = []

    def post(self, request: Request, *args: T, **kwargs: Any) -> Response:
        # Get callback_url from the POST data or URL parameters,
        # if not provided use a default
        self.callback_url = request.query_params.get("redirect_uri")
        return cast(Response, super().post(request, *args, **kwargs))


class AppleLogin(SocialLoginView):
    adapter_class = AppleOAuth2Adapter
    client_class = AppleOAuth2Client
    serializer_class = SocialLoginSerializer
    authentication_classes: List[Any] = []

    def post(self, request: Request, *args: T, **kwargs: Any) -> Response:
        # Get callback_url from the POST data or URL parameters,
        # if not provided use a default
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
