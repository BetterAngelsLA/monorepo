"""
Exception hierarchy for the sms app.

All provider-raised errors derive from `SmsError` so callers can catch a
single base class regardless of which provider is wired up. Providers
should wrap vendor SDK exceptions in `ProviderError` (with `provider`
and, where available, HTTP `status_code`) rather than leaking SDK types.
"""


class SmsError(Exception):
    """Base exception for the sms app."""


class ProviderError(SmsError):
    """Raised when a provider API call fails."""

    def __init__(self, provider: str, message: str, status_code: int | None = None):
        self.provider = provider
        self.status_code = status_code
        super().__init__(provider, message, status_code)


class InvalidPhoneNumberError(SmsError):
    """Raised when a phone number fails format validation."""


class ContactNotFoundError(SmsError):
    """Raised when a contact does not exist on the provider."""
