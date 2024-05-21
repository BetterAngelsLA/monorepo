from accounts.views.auth_views import AuthRedirectView, ensure_csrf_cookie_view
from accounts.views.class_views import SignUpView
from django.urls import include, path
from organizations.backends import invitation_backend
from sesame.views import LoginView

urlpatterns = [
    path("signup/", SignUpView.as_view(), name="signup"),
    # magic link login urls
    path("magic-auth/login/", LoginView.as_view(), name="magic-auth-login"),
    # django-organizations
    path("accounts/", include("organizations.urls")),
    path("invitations/", include(invitation_backend().get_urls())),
    # Social Login
    path("auth-redirect", AuthRedirectView.as_view(), name="auth_redirect"),
    path("api/login/", include("rest_social_auth.urls_session")),
    path("api/csrf/", ensure_csrf_cookie_view, name="ensure-csrf-cookie"),
]
