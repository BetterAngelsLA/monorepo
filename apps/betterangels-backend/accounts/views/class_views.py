from typing import TypeVar, cast

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.views.generic import TemplateView

from accounts.models import User
from accounts.services import user_delete

T = TypeVar("T")


class SupportPage(TemplateView):
    template_name = "account/support.html"


class DeleteAccountPage(TemplateView):
    template_name = "account/delete_account.html"


@login_required
def delete_account(request: HttpRequest) -> HttpResponse:
    if request.method == "POST":
        try:
            user_delete(user=cast(User, request.user))
        except ValidationError as error:
            messages.error(request, "; ".join(error.messages))
        else:
            messages.success(request, "Your account has been deleted successfully.")
            return redirect("/")

    return render(request, "account/delete_account.html")
