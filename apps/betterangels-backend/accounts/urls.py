from accounts.views.class_views import SupportPage, delete_account
from django.urls import include, path
from organizations.backends import invitation_backend
from sesame.views import LoginView

urlpatterns = [
    path("support/", SupportPage.as_view()),
    path("delete-account/", delete_account, name="delete_account"),
    # magic link login urls
    path("magic-auth/login/", LoginView.as_view(), name="magic-auth-login"),
    # django-organizations
    path("accounts/", include("organizations.urls")),
    path("invitations/", include(invitation_backend().get_urls())),
]
