"""
Local/dev SMS provider.

Logs all operations to stdout and optionally writes messages to a file.
Use this for local development so no real SMS messages are sent.
"""

import json
import logging
from pathlib import Path

from django.conf import settings
from sms.enums import PhoneType, SubscriptionStatus
from sms.interface import SmsInterface
from sms.types import Contact, PhoneValidationResult, SendResult

logger = logging.getLogger(__name__)


class LocalProvider(SmsInterface):
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
        logger.info(f"[LocalSMS] Created contact: {contact}")
        return contact

    def update_contact(self, contact: Contact) -> Contact:
        self._contacts[contact.phone_number] = contact
        logger.info(f"[LocalSMS] Updated contact: {contact}")
        return contact

    def remove_contact(self, phone_number: str) -> None:
        self._contacts.pop(phone_number, None)
        logger.info(f"[LocalSMS] Removed contact: {phone_number}")

    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        self._subscriptions[phone_number] = SubscriptionStatus.SUBSCRIBED
        logger.info(f"[LocalSMS] Subscribed: {phone_number}")
        return SubscriptionStatus.SUBSCRIBED

    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        self._subscriptions[phone_number] = SubscriptionStatus.UNSUBSCRIBED
        logger.info(f"[LocalSMS] Unsubscribed: {phone_number}")
        return SubscriptionStatus.UNSUBSCRIBED

    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        return self._subscriptions.get(phone_number, SubscriptionStatus.NOT_FOUND)

    def validate_phone_number(self, phone_number: str) -> PhoneValidationResult:
        logger.info(f"[LocalSMS] Validated phone (always true locally): {phone_number}")
        return PhoneValidationResult(
            phone_number=phone_number,
            is_valid=True,
            in_service=True,
            phone_type=PhoneType.MOBILE,
            carrier="Local Dev Carrier",
        )

    def send_message(self, to: str, body: str) -> SendResult:
        msg_data = {"to": to, "body": body}
        logger.info(f"[LocalSMS] Message sent: {msg_data}")

        import time

        filename = f"{int(time.time())}_{to.replace('+', '')}.json"
        (self.output_dir / filename).write_text(json.dumps(msg_data, indent=2))

        return SendResult(success=True, provider_message_id=f"local-{filename}")
