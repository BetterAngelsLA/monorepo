"""
CheapestTexting SMS provider.

API docs: https://api.app.cheapesttexting.com/public_api/v1/docs/
Base URL: https://api.app.cheapesttexting.com/public_api/v1
Auth: API key sent in the `X-API-KEY` request header.

Key concepts:
- "Campaigns" are keyword-based subscriber groups (e.g. keyword "JOIN").
- Contacts are identified by phone number.
- Sending a message (microblog) targets one or more campaigns.
  For a single/test message, set is_test=True and provide test_phone.
- A trunk_number (the sending phone number ID) is required for messages.

Settings (Django settings / env vars):
    CHEAPEST_TEXTING_API_KEY: str  [REQUIRED]
        API key for authentication. Obtain from CheapestTexting dashboard under
        API settings. Sent as a Bearer token in the Authorization header.

    CHEAPEST_TEXTING_BASE_URL: str  [optional]
        Base URL for the API. Defaults to
        "https://api.app.cheapesttexting.com/public_api/v1".
        You should not need to change this.

    CHEAPEST_TEXTING_CAMPAIGN_ID: int  [REQUIRED]
        The numeric ID of the campaign (subscriber group) to use for contacts
        and messages. In CheapestTexting, a "campaign" is a keyword-based
        opt-in list — contacts join by texting a keyword (e.g. "JOIN") to
        your number. Every message you send targets at least one campaign.
        Find this in the CheapestTexting dashboard under Campaigns, or via
        GET /campaigns/.

    CHEAPEST_TEXTING_TRUNK_NUMBER: int  [REQUIRED]
        The numeric ID (not the phone number) of the sending phone number.
        CheapestTexting calls these "trunk numbers" — they are the phone
        numbers (10DLC, toll-free, or short code) assigned to your account.
        Every outbound message must specify which trunk number to send from.
        Find this via GET /user/info/ → active_subscriptions[].trunk_numbers[].id
        or in the dashboard under Numbers.
"""

import httpx
from django.conf import settings
from sms.capabilities import ContactManager, MessageSender, SubscriptionManager
from sms.enums import SubscriptionStatus
from sms.errors import ProviderError
from sms.types import Contact, SendResult

PROVIDER_NAME = "cheapest_texting"


class CheapestTextingProvider(MessageSender, ContactManager, SubscriptionManager):
    def __init__(self) -> None:
        self.api_key: str = settings.CHEAPEST_TEXTING_API_KEY
        self.base_url: str = settings.CHEAPEST_TEXTING_BASE_URL
        self.campaign_id: int = settings.CHEAPEST_TEXTING_CAMPAIGN_ID
        self.trunk_number: int = settings.CHEAPEST_TEXTING_TRUNK_NUMBER

        if not self.api_key:
            raise ValueError(
                "CHEAPEST_TEXTING_API_KEY is required. "
                "Get your API key from the CheapestTexting dashboard under API settings."
            )
        if not self.campaign_id:
            raise ValueError(
                "CHEAPEST_TEXTING_CAMPAIGN_ID is required. "
                "This is the numeric ID of your campaign (keyword opt-in list). "
                "Find it in the CheapestTexting dashboard under Campaigns, or via GET /campaigns/."
            )
        if not self.trunk_number:
            raise ValueError(
                "CHEAPEST_TEXTING_TRUNK_NUMBER is required. "
                "This is the numeric ID of your sending phone number (not the phone number itself). "
                "Find it via GET /user/info/ under active_subscriptions → trunk_numbers, "
                "or in the CheapestTexting dashboard under Numbers."
            )

        self.client = httpx.Client(
            base_url=self.base_url,
            headers={"X-API-KEY": self.api_key},
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

    # ─── Contact Management ───────────────────────────────────────────
    # POST /contacts/           — create or update (upsert by phone)
    # GET  /contacts/{phone}/   — get contact info
    # POST /contacts/{phone}/remove/ — remove from campaign(s)

    def create_contact(self, contact: Contact) -> Contact:
        payload: dict = {
            "phone": contact.phone_number,
            "campaigns": [self.campaign_id],
        }
        if contact.first_name:
            payload["first_name"] = contact.first_name
        if contact.last_name:
            payload["last_name"] = contact.last_name
        if contact.email:
            payload["email"] = contact.email
        if contact.metadata:
            payload["metadata"] = str(contact.metadata)

        response = self._request("POST", "/contacts/", json=payload)
        data = response.json()
        contact.external_id = str(data.get("id", ""))
        return contact

    def update_contact(self, contact: Contact) -> Contact:
        # CheapestTexting's POST /contacts/ is an upsert — same endpoint for create and update.
        return self.create_contact(contact)

    def remove_contact(self, phone_number: str) -> None:
        self._request("POST", f"/contacts/{phone_number}/remove/", json={})

    # ─── Campaigns ───────────────────────────────────────────────────
    # GET /campaigns/{id}/ — fetch a single campaign by ID

    def get_campaign(self, campaign_id: int | None = None) -> dict:
        """Return the raw campaign JSON for the given ID (defaults to the configured campaign)."""
        cid = campaign_id if campaign_id is not None else self.campaign_id
        response = self._request("GET", f"/campaigns/{cid}/")
        data: dict = response.json()
        return data

    # ─── Subscription Management ─────────────────────────────────────
    # POST /campaigns/{campaign_pk}/contacts/{phone}/add/  — subscribe
    # POST /contacts/{phone}/opt_out/                      — unsubscribe
    # GET  /contacts/{phone}/                              — check is_active

    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        self._request(
            "POST",
            f"/campaigns/{self.campaign_id}/contacts/{phone_number}/add/",
            json={},
        )
        return SubscriptionStatus.SUBSCRIBED

    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        self._request("POST", f"/contacts/{phone_number}/opt_out/", json={})
        return SubscriptionStatus.UNSUBSCRIBED

    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        try:
            response = self._request("GET", f"/contacts/{phone_number}/")
        except ProviderError as e:
            if e.status_code == 404:
                return SubscriptionStatus.NOT_FOUND
            raise
        data = response.json()
        if data.get("is_active"):
            return SubscriptionStatus.SUBSCRIBED
        return SubscriptionStatus.UNSUBSCRIBED

    # ─── Messaging ───────────────────────────────────────────────────
    # POST /messages/ — send a microblog
    # For single (test) messages: is_test=True, test_phone=<phone>
    # For group messages: is_test=False, campaigns=[<ids>]

    def send_message(self, to: str, body: str) -> SendResult:
        payload: dict = {
            "campaigns": [self.campaign_id],
            "message": body,
            "is_test": True,
            "test_phone": to,
            "trunk_number": self.trunk_number,
            "content_type": "SMS",
        }
        response = self._request("POST", "/messages/", json=payload)
        data = response.json()
        return SendResult(
            success=True,
            provider_message_id=str(data.get("id", "")),
        )
