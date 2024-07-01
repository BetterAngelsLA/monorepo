from typing import TypeVar

from accounts.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import models
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
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


class DeleteAccountPage(TemplateView):
    template_name = "account/delete_account.html"


@login_required
def delete_account(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        user = request.user
        user.delete()
        messages.success(request, "Your account has been deleted successfully.")
        return redirect("/")

    return render(request, "account/delete_account.html")
