from typing import TypeVar

from accounts.forms import UserCreationForm
from django.db import models
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView

T = TypeVar("T")


class SignUpView(CreateView[models.Model, UserCreationForm]):
    form_class = UserCreationForm
    success_url = reverse_lazy("login")
    template_name = "registration/signup.html"


class GoogleOauthHomePage(TemplateView):
    template_name = "account/google-oauth-homepage.html"


class SupportPage(TemplateView):
    template_name = "account/support.html"
