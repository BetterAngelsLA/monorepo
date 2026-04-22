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
