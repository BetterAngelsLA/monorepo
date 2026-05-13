"""
Shared enums for the sms app.

Provider-agnostic value types used in capability return values and DTOs.
Providers are responsible for mapping their vendor-specific strings
(e.g. Twilio's `line_type_intelligence.type`) onto these enums so that
calling code never has to branch on provider name.
"""

from enum import Enum


class SubscriptionStatus(Enum):
    SUBSCRIBED = "subscribed"
    UNSUBSCRIBED = "unsubscribed"
    PENDING = "pending"
    NOT_FOUND = "not_found"


class PhoneType(Enum):
    MOBILE = "mobile"
    LANDLINE = "landline"
    VOIP = "voip"
    UNKNOWN = "unknown"
