from typing import TypeVar

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.views.generic import TemplateView

T = TypeVar("T")


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
