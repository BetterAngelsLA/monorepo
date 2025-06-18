from accounts.views.class_views import SupportPage, delete_account
from django.urls import include, path
from organizations.backends import invitation_backend

urlpatterns = [
    path("support/", SupportPage.as_view()),
    path("delete-account/", delete_account, name="delete_account"),
    # django-organizations
    path("accounts/", include("organizations.urls")),
    path("invitations/", include(invitation_backend().get_urls())),
]
