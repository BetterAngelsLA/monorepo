from abc import ABC, abstractmethod

from sms.enums import SubscriptionStatus
from sms.types import Contact, PhoneValidationResult, SendResult


class MessageSender(ABC):
    """Can send SMS messages."""

    @abstractmethod
    def send_message(self, to: str, body: str) -> SendResult:
        """Send a single SMS message to a phone number."""
        ...


class ContactManager(ABC):
    """Can create, update, and remove contacts."""

    @abstractmethod
    def create_contact(self, contact: Contact) -> Contact:
        """Create a contact on the provider. Returns the contact with external_id populated."""
        ...

    @abstractmethod
    def update_contact(self, contact: Contact) -> Contact:
        """Update an existing contact. Identifies by external_id or phone_number."""
        ...

    @abstractmethod
    def remove_contact(self, phone_number: str) -> None:
        """Remove a contact from the provider."""
        ...


class SubscriptionManager(ABC):
    """Can manage opt-in / opt-out subscriptions."""

    @abstractmethod
    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        """Subscribe a phone number to receive messages."""
        ...

    @abstractmethod
    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        """Unsubscribe a phone number from receiving messages."""
        ...

    @abstractmethod
    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        """Query whether a phone number is subscribed, unsubscribed, or pending."""
        ...


class PhoneValidator(ABC):
    """Can verify if a phone number is real and in service."""

    @abstractmethod
    def validate_phone_number(self, phone_number: str) -> PhoneValidationResult:
        """
        Check if a phone number is real and in service.

        Use `phonenumbers` for format validation before calling this method.
        This method hits the provider's API for real-time verification.
        """
        ...
