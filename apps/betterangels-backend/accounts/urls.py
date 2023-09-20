from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from .views import AuthRedirectView, GoogleLogin, SignUpView

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("rest-auth/google/", GoogleLogin.as_view(), name="google_login"),
    path("auth-redirect", AuthRedirectView.as_view(), name="auth_redirect"),
    path("oauthredirect", AuthRedirectView.as_view(), name="oauth_redirect"),
]
