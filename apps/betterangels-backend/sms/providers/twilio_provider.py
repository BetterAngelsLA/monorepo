"""
Twilio SMS provider.

Uses the official Twilio Python SDK.
Docs: https://www.twilio.com/docs/sms
Lookup: https://www.twilio.com/docs/lookup/v2-api

Settings (Django settings / env vars):
    TWILIO_ACCOUNT_SID: str  [REQUIRED]
        Account SID for your Twilio account. Find it on the Twilio Console
        dashboard at https://console.twilio.com.

    TWILIO_AUTH_TOKEN: str  [REQUIRED]
        Auth Token paired with the Account SID. Same location as the SID
        on the Twilio Console dashboard. Used together as HTTP Basic
        credentials by the Twilio SDK.

    TWILIO_FROM_NUMBER: str  [REQUIRED if TWILIO_MESSAGING_SERVICE_SID is not set]
        A Twilio-provisioned phone number (E.164 format, e.g. "+13105551234")
        to use as the sender. Used when no messaging service SID is
        configured. Find your numbers under Phone Numbers → Manage → Active
        Numbers in the Twilio Console.

    TWILIO_MESSAGING_SERVICE_SID: str  [optional]
        SID of a Twilio Messaging Service (starts with "MG..."). When set,
        messages are sent via the messaging service instead of a single
        from-number, enabling features like sender pools, sticky sender,
        and geo-routing. Find it under Messaging → Services in the Twilio
        Console.
"""

from django.conf import settings
from sms.capabilities import MessageSender, PhoneValidator
from sms.enums import PhoneType
from sms.errors import ProviderError
from sms.types import PhoneValidationResult, SendResult
from twilio.rest import Client as TwilioClient  # type: ignore[import-untyped]

PROVIDER_NAME = "twilio"


class TwilioProvider(MessageSender, PhoneValidator):
    def __init__(self) -> None:
        self.account_sid: str = settings.TWILIO_ACCOUNT_SID
        self.auth_token: str = settings.TWILIO_AUTH_TOKEN
        self.from_number: str = settings.TWILIO_FROM_NUMBER
        self.messaging_service_sid: str = settings.TWILIO_MESSAGING_SERVICE_SID
        self.client = TwilioClient(self.account_sid, self.auth_token)

    # ─── Phone Validation ────────────────────────────────────────────

    def validate_phone_number(self, phone_number: str) -> PhoneValidationResult:
        """
        Use Twilio Lookup v2 to check if a number is real and in service.
        Requires: `fields=line_type_intelligence` for carrier/type info.
        """
        try:
            lookup = self.client.lookups.v2.phone_numbers(phone_number).fetch(fields="line_type_intelligence")
        except Exception as e:
            raise ProviderError(
                provider=PROVIDER_NAME,
                message=f"Lookup failed for {phone_number}: {e}",
            ) from e

        line_type_info = lookup.line_type_intelligence or {}
        type_str = line_type_info.get("type", "unknown")

        phone_type_map = {
            "mobile": PhoneType.MOBILE,
            "landline": PhoneType.LANDLINE,
            "voip": PhoneType.VOIP,
            "nonFixedVoip": PhoneType.VOIP,
            "non_fixed_voip": PhoneType.VOIP,
        }

        return PhoneValidationResult(
            phone_number=lookup.phone_number,
            is_valid=lookup.valid,
            in_service=lookup.valid,
            phone_type=phone_type_map.get(type_str, PhoneType.UNKNOWN),
            carrier=line_type_info.get("carrier_name", ""),
        )

    # ─── Messaging ───────────────────────────────────────────────────

    def send_message(self, to: str, body: str) -> SendResult:
        try:
            params: dict[str, str] = {"body": body, "to": to}
            if self.messaging_service_sid:
                params["messaging_service_sid"] = self.messaging_service_sid
            else:
                params["from_"] = self.from_number
            message = self.client.messages.create(**params)
            return SendResult(success=True, provider_message_id=message.sid)
        except Exception as e:
            raise ProviderError(
                provider=PROVIDER_NAME,
                message=f"Failed to send to {to}: {e}",
            ) from e
