from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from dj_rest_auth.registration.views import SocialLoginView
from django.db import models
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView

from .forms import UserCreationForm


class SignUpView(CreateView[models.Model, UserCreationForm]):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
