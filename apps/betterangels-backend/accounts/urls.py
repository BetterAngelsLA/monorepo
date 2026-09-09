from django.urls import include, path
from organizations.backends import invitation_backend

from accounts.views.class_views import SupportPage, delete_account

urlpatterns = [
    path("support/", SupportPage.as_view()),
    path("delete-account/", delete_account, name="delete_account"),
    # Only the invitation flow from django-organizations.  Its generic
    # organization/member CRUD views are deliberately not routed: nothing here uses
    # them, they render an unstyled parallel admin, and they mutate memberships
    # without going through ``accounts.services`` — deleting one there leaves the
    # user's org-scoped roles granted.
    path("invitations/", include(invitation_backend().get_urls())),
]
