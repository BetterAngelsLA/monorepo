import base64
import json
from typing import Any, List, TypeVar, Union
from urllib.parse import unquote

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from django.db import models
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import UserCreationForm
from .serializers import SocialLoginSerializer

T = TypeVar("T")


class SignUpView(CreateView[models.Model, UserCreationForm]):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    authentication_classes: List[Any] = []

    def post(self, request: Request, *args: T, **kwargs: Union[str, Any]) -> Response:
        # Get callback_url from the POST data or URL parameters,
        # if not provided use a default
        self.callback_url = request.query_params.get("redirect_uri")
        return super(GoogleLogin, self).post(request, *args, **kwargs)  # type: ignore


def base64url_decode(input_str: str) -> str:
    # Transform base64url string to regular base64 string
    remainder = len(input_str) % 4
    if remainder == 2:
        input_str += "=="
    elif remainder == 3:
        input_str += "="

    return base64.urlsafe_b64decode(input_str).decode("utf-8")


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
            redirect_uri += "&".join(
                f"{key}={value}" for key, value in request.query_params.items()
            )

        response = Response(status=302)  # 302 is for temporary redirect
        response["Location"] = redirect_uri
        return response
