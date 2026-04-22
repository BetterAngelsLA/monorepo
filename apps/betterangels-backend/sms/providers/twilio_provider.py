"""
Twilio SMS provider.

Uses the official Twilio Python SDK.
Docs: https://www.twilio.com/docs/sms
Lookup: https://www.twilio.com/docs/lookup/v2-api
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
            message = self.client.messages.create(
                body=body,
                from_=self.from_number,
                to=to,
            )
            return SendResult(success=True, provider_message_id=message.sid)
        except Exception as e:
            raise ProviderError(
                provider=PROVIDER_NAME,
                message=f"Failed to send to {to}: {e}",
            ) from e
