"""
SimpleTexting SMS provider.

API docs: https://simpletexting.com/api/docs/v2/
Base URL: https://api-app2.simpletexting.com/v2
Auth: Bearer token in Authorization header.
"""

import httpx
from django.conf import settings
from sms.capabilities import ContactManager, MessageSender, SubscriptionManager
from sms.enums import SubscriptionStatus
from sms.errors import ProviderError
from sms.types import Contact, SendResult

PROVIDER_NAME = "simple_texting"
BASE_URL = "https://api-app2.simpletexting.com/v2"


class SimpleTextingProvider(MessageSender, ContactManager, SubscriptionManager):
    def __init__(self) -> None:
        self.api_token: str = settings.SIMPLE_TEXTING_API_TOKEN
        self.client = httpx.Client(
            base_url=BASE_URL,
            headers={
                "Authorization": f"Bearer {self.api_token}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    def _request(self, method: str, path: str, **kwargs) -> httpx.Response:  # type: ignore[no-untyped-def]
        response = self.client.request(method, path, **kwargs)
        if not response.is_success:
            raise ProviderError(
                provider=PROVIDER_NAME,
                message=f"{method} {path} failed: {response.text}",
                status_code=response.status_code,
            )
        return response

    # ─── Messaging ───────────────────────────────────────────────────
    # POST /api/messages
    # Required: contactPhone, mode, text
    # Returns: {"id": "...", "credits": 0}

    def send_message(self, to: str, body: str) -> SendResult:
        payload: dict = {
            "contactPhone": to.lstrip("+"),
            "text": body,
            "mode": "AUTO",
        }
        response = self._request("POST", "/api/messages", json=payload)
        data = response.json()
        return SendResult(success=True, provider_message_id=data.get("id", ""))

    # ─── Contact Management ──────────────────────────────────────────
    # POST   /api/contacts          — create (upsert by default)
    # PUT    /api/contacts/{phone}  — update
    # DELETE /api/contacts/{phone}  — delete
    # GET    /api/contacts/{phone}  — get

    def create_contact(self, contact: Contact) -> Contact:
        payload: dict = {
            "contactPhone": contact.phone_number.lstrip("+"),
        }
        if contact.first_name:
            payload["firstName"] = contact.first_name
        if contact.last_name:
            payload["lastName"] = contact.last_name
        if contact.email:
            payload["email"] = contact.email
        if contact.metadata:
            payload["customFields"] = contact.metadata

        response = self._request("POST", "/api/contacts", json=payload)
        data = response.json()
        contact.external_id = data.get("id", "")
        return contact

    def update_contact(self, contact: Contact) -> Contact:
        phone = contact.phone_number.lstrip("+")
        payload: dict = {}
        if contact.first_name:
            payload["firstName"] = contact.first_name
        if contact.last_name:
            payload["lastName"] = contact.last_name
        if contact.email:
            payload["email"] = contact.email
        if contact.metadata:
            payload["customFields"] = contact.metadata

        response = self._request("PUT", f"/api/contacts/{phone}", json=payload)
        data = response.json()
        contact.external_id = data.get("id", contact.external_id)
        return contact

    def remove_contact(self, phone_number: str) -> None:
        phone = phone_number.lstrip("+")
        self._request("DELETE", f"/api/contacts/{phone}")

    # ─── Subscription Management ─────────────────────────────────────
    # SimpleTexting handles opt-in/opt-out automatically via STOP/START keywords.
    # The contact's subscriptionStatus field reflects their state.
    # There is no explicit subscribe/unsubscribe API endpoint — status is
    # managed through contact creation (opt-in) and keyword responses (opt-out).
    #
    # We can read status via GET /api/contacts/{phone} and map:
    #   OPT_IN     → SUBSCRIBED
    #   OPT_OUT    → UNSUBSCRIBED
    #   UNKNOWN    → NOT_FOUND

    _STATUS_MAP: dict[str, SubscriptionStatus] = {
        "OPT_IN": SubscriptionStatus.SUBSCRIBED,
        "OPT_OUT": SubscriptionStatus.UNSUBSCRIBED,
    }

    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        # Creating a contact with a phone number opts them in.
        # If they previously opted out, the carrier/provider must handle re-opt-in
        # (typically via the contact texting a keyword like START).
        self.create_contact(Contact(phone_number=phone_number))
        return SubscriptionStatus.SUBSCRIBED

    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        # SimpleTexting requires the contact to text STOP.
        # There is no API endpoint to force an unsubscribe.
        # We delete the contact as the closest programmatic equivalent.
        self.remove_contact(phone_number)
        return SubscriptionStatus.UNSUBSCRIBED

    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        phone = phone_number.lstrip("+")
        try:
            response = self._request("GET", f"/api/contacts/{phone}")
        except ProviderError as e:
            if e.status_code == 404:
                return SubscriptionStatus.NOT_FOUND
            raise
        data = response.json()
        status_str = data.get("subscriptionStatus", "")
        return self._STATUS_MAP.get(status_str, SubscriptionStatus.NOT_FOUND)
