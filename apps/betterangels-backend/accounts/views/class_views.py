from typing import TypeVar

from accounts.forms import UserCreationForm
from accounts.models import User
from accounts.serializers import ClientProfileSerializer, UserSerializer
from clients.models import ClientProfile
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import models
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.views.generic import CreateView, TemplateView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.generics import ListAPIView, ListCreateAPIView
from rest_framework.pagination import PageNumberPagination

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


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class UserListView(ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    pagination_class = StandardResultsSetPagination


class ClientProfileList(ListCreateAPIView):
    queryset = ClientProfile.objects.all()
    serializer_class = ClientProfileSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["user__first_name", "user__last_name", "nickname"]
    search_fields = ["user__first_name", "user__last_name", "nickname"]
    ordering_fields = ["id", "user__first_name", "user__last_name"]
