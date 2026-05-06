"""
EZ Texting SMS provider.

API docs: https://developers.eztexting.com/
Base URL: https://a.eztexting.com/v1
Auth: HTTP Basic Authentication using App Key (username) and App Secret (password).
      OAuth2 bearer tokens are also supported by the API but not used here.

Key concepts:
- "Contacts" are identified by phone number; create/update share a single
  upsert endpoint (POST /v1/contacts).
- "Contact Groups" are optional subscriber lists. They are analogous to
  CheapestTexting "campaigns" but are NOT required to send messages.
- Messages can target individual phone numbers (`toNumbers`) and/or groups
  (`groupIds`). For 1:1 sends we use `toNumbers`.
- EZ Texting does not expose a public opt-in / un-block API. Outbound texts
  can be programmatically blocked via POST /v1/blocks (used here for
  `unsubscribe`); re-enabling delivery typically requires the recipient to
  text START, or a manual change in the dashboard.

Settings (Django settings / env vars):
    EZ_TEXTING_APP_KEY: str  [REQUIRED]
        App Key (username) issued by EZ Texting. Find this in the dashboard
        under Settings → API.

    EZ_TEXTING_APP_SECRET: str  [REQUIRED]
        App Secret (password) paired with the App Key. Same location in the
        dashboard. Sent together with the App Key as HTTP Basic credentials.

    EZ_TEXTING_BASE_URL: str  [optional]
        Base URL for the API. Defaults to "https://a.eztexting.com/v1".
        You should not normally need to change this.

    EZ_TEXTING_GROUP_ID: str  [optional]
        Numeric ID of a Contact Group to associate new contacts with. When
        set, `create_contact` adds the contact to this group, and
        `subscribe` / `unsubscribe` toggle group membership in addition to
        their normal behavior. Find group IDs via GET /v1/groups, or in the
        dashboard under Contacts → Groups.
"""

import httpx
from django.conf import settings
from sms.capabilities import ContactManager, MessageSender, SubscriptionManager
from sms.enums import SubscriptionStatus
from sms.errors import ProviderError
from sms.types import Contact, SendResult

PROVIDER_NAME = "ez_texting"
DEFAULT_BASE_URL = "https://a.eztexting.com/v1"


class EzTextingProvider(MessageSender, ContactManager, SubscriptionManager):
    def __init__(self) -> None:
        self.app_key: str = settings.EZ_TEXTING_APP_KEY
        self.app_secret: str = settings.EZ_TEXTING_APP_SECRET
        self.base_url: str = settings.EZ_TEXTING_BASE_URL or DEFAULT_BASE_URL
        self.group_id: str = settings.EZ_TEXTING_GROUP_ID

        if not self.app_key:
            raise ValueError(
                "EZ_TEXTING_APP_KEY is required. " "Find it in the EZ Texting dashboard under Settings → API."
            )
        if not self.app_secret:
            raise ValueError(
                "EZ_TEXTING_APP_SECRET is required. " "Find it in the EZ Texting dashboard under Settings → API."
            )

        self.client = httpx.Client(
            base_url=self.base_url,
            auth=httpx.BasicAuth(self.app_key, self.app_secret),
            headers={"Accept": "application/json"},
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

    @staticmethod
    def _normalize_phone(phone: str) -> str:
        # EZ Texting expects bare digits in path/body params.
        return phone.lstrip("+")

    # ─── Messaging ───────────────────────────────────────────────────
    # POST /v1/messages — Create Message (sends now or schedules via sendAt)

    def send_message(self, to: str, body: str) -> SendResult:
        payload: dict = {
            "message": body,
            "toNumbers": [self._normalize_phone(to)],
            "messageType": "SMS",
        }
        response = self._request("POST", "/messages", json=payload)
        data = response.json() if response.content else {}
        return SendResult(
            success=True,
            provider_message_id=str(data.get("id", "")),
        )

    # ─── Contact Management ──────────────────────────────────────────
    # POST   /v1/contacts                — Create or Update (upsert by phone)
    # GET    /v1/contacts/{phoneNumber}  — Get
    # DELETE /v1/contacts/{phoneNumber}  — Delete

    def _contact_payload(self, contact: Contact, *, include_group: bool) -> dict:
        payload: dict = {"phoneNumber": self._normalize_phone(contact.phone_number)}
        if contact.first_name:
            payload["firstName"] = contact.first_name
        if contact.last_name:
            payload["lastName"] = contact.last_name
        if contact.email:
            payload["email"] = contact.email
        if contact.metadata:
            # EZ Texting stores arbitrary text in `note` (max 200 chars).
            payload["note"] = str(contact.metadata)[:200]
        if include_group and self.group_id:
            payload["groupIdsAdd"] = [self.group_id]
        return payload

    def create_contact(self, contact: Contact) -> Contact:
        payload = self._contact_payload(contact, include_group=True)
        response = self._request("POST", "/contacts", json=payload)
        data = response.json() if response.content else {}
        contact.external_id = str(data.get("id", "") or data.get("phoneNumber", ""))
        return contact

    def update_contact(self, contact: Contact) -> Contact:
        # POST /v1/contacts is an upsert — same endpoint for create and update.
        return self.create_contact(contact)

    def remove_contact(self, phone_number: str) -> None:
        phone = self._normalize_phone(phone_number)
        self._request("DELETE", f"/contacts/{phone}")

    # ─── Subscription Management ─────────────────────────────────────
    # EZ Texting does not expose a single opt-in/opt-out toggle. Opt-out is
    # typically driven by the carrier (recipient texts STOP) or by blocking
    # outbound delivery via POST /v1/blocks. There is no public unblock
    # endpoint, so re-subscribing must be handled by the recipient texting
    # START or by a dashboard admin.
    #
    # We map the capability surface as follows:
    #   subscribe(phone)       → upsert contact (and add to group if configured)
    #   unsubscribe(phone)     → POST /v1/blocks (and remove from group if configured)
    #   get_subscription_status(phone) → based on contact existence

    def subscribe(self, phone_number: str) -> SubscriptionStatus:
        self.create_contact(Contact(phone_number=phone_number))
        return SubscriptionStatus.SUBSCRIBED

    def unsubscribe(self, phone_number: str) -> SubscriptionStatus:
        phone = self._normalize_phone(phone_number)
        self._request("POST", "/blocks", json={"phoneNumbers": [phone]})
        if self.group_id:
            payload = {
                "phoneNumber": phone,
                "groupIdsRemove": [self.group_id],
            }
            self._request("POST", "/contacts", json=payload)
        return SubscriptionStatus.UNSUBSCRIBED

    def get_subscription_status(self, phone_number: str) -> SubscriptionStatus:
        phone = self._normalize_phone(phone_number)
        try:
            self._request("GET", f"/contacts/{phone}")
        except ProviderError as e:
            if e.status_code == 404:
                return SubscriptionStatus.NOT_FOUND
            raise
        return SubscriptionStatus.SUBSCRIBED
