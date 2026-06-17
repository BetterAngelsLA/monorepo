from django.urls import path

from .headless_views import AutoCreateRequestLoginCodeView

urlpatterns = [
    path(
        "account/login/code/request",
        AutoCreateRequestLoginCodeView.as_view(),
        name="headless_account_request_login_code",
    ),
]
