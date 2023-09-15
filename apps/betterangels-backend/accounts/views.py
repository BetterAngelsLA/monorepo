import base64
import json
from urllib.parse import unquote

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from django.db import models
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.generic.edit import CreateView
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import UserCreationForm


class SignUpView(CreateView[models.Model, UserCreationForm]):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter


def is_exp_or_safe_url(url, allowed_hosts, require_https=False):
    # Allow exp:// scheme
    print(url)
    if url.startswith("exp://") or url.startswith(
        "com.paul-betterangels.simple-app://"
    ):
        return True
    return True
    return url_has_allowed_host_and_scheme(
        url, allowed_hosts, require_https=require_https
    )


class AuthRedirectView(APIView):
    def get(self, request, *args, **kwargs):
        # Extract the code or error from Google's OAuth
        state = json.loads(unquote(request.query_params.get("state", None)))
        path_back = state.get("path_back")
        print(state)

        code = request.query_params.get("code", None)
        error = request.query_params.get("error", None)

        if not path_back:
            # Handle the case where no redirect URI is provided.
            # Respond with an error or provide a default URI.
            return Response({"detail": "path_back not provided."}, status=400)

        # Forward the code (or error) to your app.
        # Assuming your app needs the code to obtain tokens.
        if code:
            path_back += f"?code={code}"
        elif error:
            path_back += f"?error={error}"

        # Check if path_back starts with the custom scheme
        print(path_back)
        if not (
            path_back.startswith("com.paul-betterangels.simple-app")
            or path_back.startswith("exp")
        ):
            return Response({"detail": "Unsafe redirect."}, status=400)

        # Manually perform the redirect
        response = HttpResponse(status=302)  # 302 is for temporary redirect
        response["Location"] = path_back
        return response
