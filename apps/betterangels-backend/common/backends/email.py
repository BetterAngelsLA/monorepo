from typing import List, cast

from django.core.mail import EmailMessage
from post_office.backends import EmailBackend as PostOfficeBackend


def _strip_demo(addr: str) -> str:
    """
    If the local-part ends with '+demo', drop it.
    e.g. 'paul+demo@example.com' → 'paul@example.com'
    """
    # only replace the first occurrence right before the '@'
    return addr.replace("+demo@", "@", 1)


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
                    setattr(msg, field, [_strip_demo(a) for a in addrs])
        return cast(int, super().send_messages(email_messages))
