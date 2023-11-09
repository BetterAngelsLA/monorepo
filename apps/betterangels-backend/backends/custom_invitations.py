from typing import TYPE_CHECKING, Any, Union

from organizations.backends.defaults import InvitationBackend
from post_office import mail
from rest_framework.request import Request

if TYPE_CHECKING:
    from accounts.models import User


class CustomInvitations(InvitationBackend):
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
            user = self.user_model.objects.create(
                email=email, password=self.user_model.objects.make_random_password()
            )
            user.is_active = False
            user.save()
        self.send_invitation(user, sender, **kwargs)

        return user

    def send_invitation(
        self, user: User, sender: Union[str, None] = None, **kwargs: Any
    ) -> bool:
        """An intermediary function for sending an invitation email that
        selects the templates, generating the token, and ensuring that the user
        has not already joined the site.
        """
        if user.is_active:
            return False

        token = self.get_token(user)
        kwargs.update({"token": token})
        self.email_message(
            user, self.invitation_subject, self.invitation_body, sender, **kwargs
        ).send()
        return True
