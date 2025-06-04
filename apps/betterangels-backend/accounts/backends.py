import uuid
from typing import Any, Optional, cast

from django.contrib.auth.models import AbstractBaseUser
from django.db import transaction
from django.http import Http404
from django.utils.translation import gettext as _
from organizations.backends.defaults import InvitationBackend
from organizations.models import Organization, OrganizationInvitation
from rest_framework.request import Request

from .forms import UserCreationForm
from .models import ExtendedOrganizationInvitation, User


class CustomInvitations(InvitationBackend):
    form_class = UserCreationForm
    invitation_body = "account/email/email_invite_organization.html"
    user_model = User

    def invite_by_email(
        self, email: str, sender: Optional[User] = None, request: Optional[Request] = None, **kwargs: Any
    ) -> AbstractBaseUser:
        with transaction.atomic():
            user, created = self.user_model.objects.get_or_create(
                email=email,
                defaults={"username": str(uuid.uuid4()), "is_active": True},
            )
            if created:
                user.set_unusable_password()
                user.save()

        self.send_invitation(user, sender, **kwargs)
        return user

    def send_invitation(self, user: AbstractBaseUser, sender: Optional[AbstractBaseUser] = None, **kwargs: Any) -> int:
        return cast(
            int, self.email_message(user, self.invitation_subject, self.invitation_body, sender, **kwargs).send()
        )

    def create_organization_invite(
        self, organization: Organization, invited_by_user: User, invitee_user: User
    ) -> OrganizationInvitation:
        """
        Creates an organization invite for given invitation user
        """
        invitation: OrganizationInvitation = ExtendedOrganizationInvitation.objects.create(
            invited_by=invited_by_user,
            invitee=invitee_user,
            organization=organization,
            invitee_identifier=invitee_user.email,
        )

        return invitation

    def activate_view(self, request: Request, user_id: str, token: str) -> Any:
        raise Http404(_("Activation step is not required."))

    def update_invitation(self, user: User) -> None:
        pass  # No-op since invitations are accepted immediately
