from typing import Any, Union

from organizations.backends.defaults import InvitationBackend
from organizations.models import Organization, OrganizationInvitation
from rest_framework.request import Request

from .forms import UserCreationForm
from .models import User


class CustomInvitations(InvitationBackend):
    form_class = UserCreationForm
    invitation_body = "account/email/email_invite_organization.html"

    def invite_by_email(
        self,
        email: str,
        sender: Union[str, None] = None,
        request: Union[Request, None] = None,
        **kwargs: Any
    ) -> Any:
        try:
            user = self.user_model.objects.get(email=email)
        except self.user_model.DoesNotExist:
            user = self.user_model.objects.create(email=email)
            user.set_unusable_password()
            user.is_active = False
            user.save()
        self.send_invitation(user, sender, **kwargs)

        return user

    def create_organization_invite(
        self, organization: Organization, invited_by_user: User, invitee_user: User
    ) -> OrganizationInvitation:
        """
        Creates an organization invite for given invitation user
        """
        invitation: OrganizationInvitation = OrganizationInvitation.objects.create(
            invited_by=invited_by_user,
            invitee=invitee_user,
            organization=organization,
            invitee_identifier=invitee_user.email,
        )

        return invitation
