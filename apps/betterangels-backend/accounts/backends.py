from typing import Any, Union

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import AbstractBaseUser
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.http import Http404
from django.shortcuts import redirect, render
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
        self,
        email: str,
        sender: Union[str, None] = None,
        request: Union[Request, None] = None,
        **kwargs: Any
    ) -> AbstractBaseUser:
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
        invitation: OrganizationInvitation = (
            ExtendedOrganizationInvitation.objects.create(
                invited_by=invited_by_user,
                invitee=invitee_user,
                organization=organization,
                invitee_identifier=invitee_user.email,
            )
        )

        return invitation

    def activate_view(self, request: Request, user_id: str, token: str) -> Any:
        """
        View function that activates the given User by setting `is_active` to
        true if the provided information is verified.
        """
        try:
            user = self.user_model.objects.get(id=user_id, is_active=False)
        except self.user_model.DoesNotExist:
            raise Http404(_("Your URL may have expired."))

        if not PasswordResetTokenGenerator().check_token(user, token):
            raise Http404(_("Your URL may have expired."))
        form = self.get_form(
            data=request.POST or None, files=request.FILES or None, instance=user
        )
        if form.is_valid():
            form.instance.is_active = True
            user = form.save()
            user.set_password(form.cleaned_data["password1"])
            user.save()
            self.activate_organizations(user)
            self.update_invitation(user)
            authenticated_user = authenticate(
                username=form.cleaned_data["username"],
                password=form.cleaned_data["password1"],
            )
            if authenticated_user is None:
                raise Http404(_("Can't authenticate user"))

            login(request, authenticated_user)
            return redirect(self.get_success_url())
        return render(request, self.registration_form_template, {"form": form})

    def update_invitation(self, user: User) -> None:
        """
        Updates the invitation to be accepted by the user.
        """
        invitation = ExtendedOrganizationInvitation.objects.get(invitee=user)
        invitation.accepted = True
        invitation.save()
