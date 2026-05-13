"""
Local/dev SMS provider.

Logs all operations to stdout and optionally writes messages to a file.
Use this for local development so no real SMS messages are sent.
"""

import json
import logging
from pathlib import Path

from django.conf import settings
from sms.capabilities import ContactManager, MessageSender, PhoneValidator, SubscriptionManager
from sms.enums import PhoneType, SubscriptionStatus
from sms.types import Contact, PhoneValidationResult, SendResult

logger = logging.getLogger(__name__)


def _mask_phone(phone_number: str) -> str:
    """Return a phone number with all but the last 4 digits replaced by '*'.

    Used to keep dev log output recognizable without writing full PII to
    stdout / log aggregators.
    """
    digits = "".join(ch for ch in phone_number if ch.isdigit())
    if len(digits) <= 4:
        return "*" * len(digits)
    return f"***{digits[-4:]}"


class LocalProvider(MessageSender, ContactManager, SubscriptionManager, PhoneValidator):
    """
    Development-only provider that logs all operations.
    Implements all interfaces so every code path can be exercised locally.
    Messages are written to SMS_FILE_PATH (default: tmp/sms-messages/).
    """

    def __init__(self) -> None:
        self.output_dir = Path(getattr(settings, "SMS_FILE_PATH", settings.BASE_DIR / "tmp" / "sms-messages"))
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._contacts: dict[str, Contact] = {}
        self._subscriptions: dict[str, SubscriptionStatus] = {}

    def create_contact(self, contact: Contact) -> Contact:
        contact.external_id = f"local-{contact.phone_number}"
        self._contacts[contact.phone_number] = contact
        logger.info("[LocalSMS] Created contact: %s", _mask_phone(contact.phone_number))
        return contact

    def update_contact(self, contact: Contact) -> Contact:
        self._contacts[contact.phone_number] = contact
        logger.info("[LocalSMS] Updated contact: %s", _mask_phone(contact.phone_number))
        return contact

    def remove_contact(self, phone_number: str) -> None:
        self._contacts.pop(phone_number, None)
        logger.info("[LocalSMS] Removed contact: %s", _mask_phone(phone_number))

    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        self._subscriptions[phone_number] = SubscriptionStatus.SUBSCRIBED
        logger.info("[LocalSMS] Subscribed: %s", _mask_phone(phone_number))
        return SubscriptionStatus.SUBSCRIBED

    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        self._subscriptions[phone_number] = SubscriptionStatus.UNSUBSCRIBED
        logger.info("[LocalSMS] Unsubscribed: %s", _mask_phone(phone_number))
        return SubscriptionStatus.UNSUBSCRIBED

    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        return self._subscriptions.get(phone_number, SubscriptionStatus.NOT_FOUND)

    def validate_phone_number(self, phone_number: str) -> PhoneValidationResult:
        logger.info("[LocalSMS] Validated phone (always true locally): %s", _mask_phone(phone_number))
        return PhoneValidationResult(
            phone_number=phone_number,
            is_valid=True,
            in_service=True,
            phone_type=PhoneType.MOBILE,
            carrier="Local Dev Carrier",
        )

    def send_message(self, to: str, body: str) -> SendResult:
        # The full message (including recipient + body) is written to a
        # local file under SMS_FILE_PATH for inspection during development.
        # The log line itself is redacted to avoid leaking PII / message
        # contents into stdout or shared log aggregators.
        msg_data = {"to": to, "body": body}
        logger.info("[LocalSMS] Message sent to %s (%d chars)", _mask_phone(to), len(body))

        import time

        filename = f"{int(time.time())}_{to.replace('+', '')}.json"
        (self.output_dir / filename).write_text(json.dumps(msg_data, indent=2))

        return SendResult(success=True, provider_message_id=f"local-{filename}")
