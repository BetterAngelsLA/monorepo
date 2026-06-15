import uuid
from typing import Any, Optional

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
    invitation_body_html = "account/email/email_invite_organization.html"
    invitation_body_txt = "account/messages/email_invite_organization.txt"
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

    def send_invitation(self, user: User, sender: Optional[AbstractBaseUser] = None, **kwargs: Any) -> int:
        if not user.email:
            raise ValueError("Cannot send invitation to a user without an email address")

        html_template, txt_template = self._resolve_invite_templates(kwargs)
        context = {"invitee_email": user.email, **demo_email_context(user.email), **kwargs}
        msg = self.email_message(
            user, self.invitation_subject, txt_template, sender, message_class=EmailMultiAlternatives, **context
        )
        html_body = render_to_string(html_template, context)
        msg.attach_alternative(html_body, "text/html")
        return int(msg.send())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _resolve_invite_templates(kwargs: dict) -> tuple[str, str]:
        """Resolve (html_template, txt_template) for an invitation email.

        If the caller passes a ``role_template`` kwarg (a
        :class:`~common.permissions.config.TemplateConfig`), returns the
        template's custom ``invite_html`` and ``invite_txt`` if set,
        falling back to the class-level defaults.

        Otherwise uses the class-level defaults.
        """
        role_template = kwargs.get("role_template")
        if role_template is not None:
            from common.permissions.config import TemplateConfig

            if isinstance(role_template, TemplateConfig):
                html = getattr(role_template, "invite_html", None) or CustomInvitations.invitation_body_html
                txt = getattr(role_template, "invite_txt", None) or CustomInvitations.invitation_body_txt
                return html, txt

        return (
            CustomInvitations.invitation_body_html,
            CustomInvitations.invitation_body_txt,
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
