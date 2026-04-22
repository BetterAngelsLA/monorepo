from dataclasses import dataclass, field

from sms.enums import PhoneType


@dataclass
class Contact:
    phone_number: str
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    external_id: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class PhoneValidationResult:
    phone_number: str
    is_valid: bool
    in_service: bool | None = None
    phone_type: PhoneType = PhoneType.UNKNOWN
    carrier: str = ""


@dataclass
class SendResult:
    success: bool
    provider_message_id: str = ""
    error: str = ""
