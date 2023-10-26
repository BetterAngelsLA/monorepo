from django.urls import path

from .views import AuthRedirectView, GoogleLogin, SignUpView, current_user, logout_view

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("rest-auth/google/", GoogleLogin.as_view(), name="api_google_login"),
    path("auth-redirect", AuthRedirectView.as_view(), name="auth_redirect"),
    path("current-user/", current_user, name="current-user"),
    path("logout/", logout_view, name="logout"),
]
