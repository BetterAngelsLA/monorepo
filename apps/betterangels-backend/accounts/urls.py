from accounts.views.api_views import current_user, generate_magic_link
from accounts.views.auth_views import AuthRedirectView, GoogleLogin, IdMeLogin
from accounts.views.class_views import SignUpView
from django.urls import include, path
from organizations.backends import invitation_backend
from sesame.views import LoginView

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    path("rest-auth/google/", GoogleLogin.as_view(), name="api_google_login"),
    path("rest-auth/idme/", IdMeLogin.as_view(), name="api_idme_login"),
    path("auth-redirect", AuthRedirectView.as_view(), name="auth_redirect"),
    path("current-user/", current_user, name="current-user"),
    # magic link login urls
    path("magic-auth/generate-link", generate_magic_link, name="generate-magic-link"),
    path("magic-auth/login/", LoginView.as_view(), name="magic-auth-login"),
    # dj-rest-auth urls
    path("rest-auth/", include("dj_rest_auth.urls")),
    # django-organizations
    path("accounts/", include("organizations.urls")),
    path("invitations/", include(invitation_backend().get_urls())),
]
