import uuid
from typing import Any, Optional

from accounts.enums import OrgType
from accounts.registry import get_invite_templates
from django.contrib.auth.models import AbstractBaseUser
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.http import Http404
from django.template.loader import render_to_string
from django.utils.translation import gettext as _
from organizations.backends.defaults import InvitationBackend
from organizations.models import Organization, OrganizationInvitation
from rest_framework.request import Request

from .forms import UserCreationForm
from .models import ExtendedOrganizationInvitation, User
from .utils import demo_email_context


class CustomInvitations(InvitationBackend):
    form_class = UserCreationForm
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

    def _get_templates_for_org(self, organization: Organization | None) -> dict[str, str]:
        """Return email template paths based on the organization's type."""
        if organization is None:
            return get_invite_templates(OrgType.OUTREACH)
        try:
            org_type = organization.profile.org_type  # type: ignore[union-attr]
        except Exception:
            org_type = OrgType.OUTREACH
        return get_invite_templates(org_type)

    def send_invitation(self, user: User, sender: Optional[AbstractBaseUser] = None, **kwargs: Any) -> int:
        if not user.email:
            raise ValueError("Cannot send invitation to a user without an email address")

        organization = kwargs.get("organization")
        templates = self._get_templates_for_org(organization)

        invitation = kwargs.get("invitation")
        domain = kwargs.get("domain")
        accept_url = ""
        if invitation and domain:
            accept_url = f"https://{domain.domain}/operator/accept-invite/{invitation.pk}"

        context = {
            "invitee_email": user.email,
            "organization_name": organization.name if organization else "",
            "invited_by_name": sender.full_name if sender else "",
            "accept_url": accept_url,
            **demo_email_context(user.email),
            **kwargs,
        }
        msg = self.email_message(
            user, self.invitation_subject, templates["txt"], sender, message_class=EmailMultiAlternatives, **context
        )
        html_body = render_to_string(templates["html"], context)
        msg.attach_alternative(html_body, "text/html")
        return int(msg.send())

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
