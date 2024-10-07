from collections import UserList

from accounts.views.auth_views import AppleLogin, AuthRedirectView, GoogleLogin
from accounts.views.class_views import (
    ClientProfileList,
    GoogleOauthHomePage,
    SignUpView,
    SupportPage,
    UserListView,
    delete_account,
)
from django.urls import include, path
from organizations.backends import invitation_backend
from sesame.views import LoginView

urlpatterns = [
    path("google-oauth-homepage/", GoogleOauthHomePage.as_view()),
    path("support/", SupportPage.as_view()),
    path("delete-account/", delete_account, name="delete_account"),
    path("signup/", SignUpView.as_view(), name="signup"),
    path("rest-auth/google/", GoogleLogin.as_view(), name="api_google_login"),
    path("rest-auth/apple/", AppleLogin.as_view(), name="api_apple_login"),
    path("auth-redirect", AuthRedirectView.as_view(), name="auth_redirect"),
    # magic link login urls
    path("magic-auth/login/", LoginView.as_view(), name="magic-auth-login"),
    # dj-rest-auth urls
    path("rest-auth/", include("dj_rest_auth.urls")),
    # django-organizations
    path("accounts/", include("organizations.urls")),
    path("invitations/", include(invitation_backend().get_urls())),
    path("users/", UserListView.as_view(), name="user-list"),
    path("client-profiles/", ClientProfileList.as_view(), name="client-profile-list"),
]
