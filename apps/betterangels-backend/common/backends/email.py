from typing import List, cast

from common.utils import strip_demo_tag
from django.core.mail import EmailMessage
from post_office.backends import EmailBackend as PostOfficeBackend


class CustomPostOfficeEmailBackend(PostOfficeBackend):
    """
    Wraps post_office.backends.EmailBackend to strip '+demo' tags
    from to/cc/bcc before any messages are sent.
    """

    def send_messages(self, email_messages: List[EmailMessage]) -> int:
        """
        Overrides the base method to sanitize recipient addresses before sending.

        :param email_messages: list of EmailMessage objects queued to send
        :return: number of successfully delivered messages
        """
        for msg in email_messages:
            for field in ("to", "cc", "bcc"):
                if addrs := getattr(msg, field):
                    setattr(msg, field, [strip_demo_tag(a) for a in addrs])
        return cast(int, super().send_messages(email_messages))
