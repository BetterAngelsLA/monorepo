"""
Demo command to test the CheapestTexting SMS provider.

Discovery (only requires CHEAPEST_TEXTING_API_KEY):
    # List trunk numbers + campaigns so you can populate
    # CHEAPEST_TEXTING_TRUNK_NUMBER and CHEAPEST_TEXTING_CAMPAIGN_ID.
    python manage.py cheapest_texting_demo info

Once trunk_number and campaign_id are configured:
    python manage.py cheapest_texting_demo create-contact +13232066439 --first-name Joe --last-name Smith
    python manage.py cheapest_texting_demo send +13232066439
    python manage.py cheapest_texting_demo subscribe +13232066439
    python manage.py cheapest_texting_demo status +13232066439
    python manage.py cheapest_texting_demo unsubscribe +13232066439
    python manage.py cheapest_texting_demo remove-contact +13232066439

Inspect a single campaign by ID (only needs API key):
    python manage.py cheapest_texting_demo campaign 28842
"""

import json
from typing import Any

import httpx
from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser
from sms.errors import ProviderError
from sms.providers.cheapest_texting import CheapestTextingProvider
from sms.types import Contact


class Command(BaseCommand):
    help = "Demo the CheapestTexting SMS provider."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "action",
            choices=[
                "info",
                "send",
                "subscribe",
                "unsubscribe",
                "status",
                "campaign",
                "create-contact",
                "remove-contact",
            ],
            help="Action to perform.",
        )
        parser.add_argument(
            "target",
            nargs="?",
            default=None,
            help=(
                "Phone number in E.164 format for messaging/contact actions, "
                "or campaign ID for the 'campaign' action. Not used by 'info'."
            ),
        )
        parser.add_argument(
            "--message",
            default="Hello from Better Angels! This is a CheapestTexting test message.",
            help="Custom message body for the send action.",
        )
        parser.add_argument("--first-name", default="", help="First name (create-contact only).")
        parser.add_argument("--last-name", default="", help="Last name (create-contact only).")
        parser.add_argument("--email", default="", help="Email (create-contact only).")

    def handle(self, *args: Any, **options: Any) -> None:
        action = options["action"]
        target = options["target"]
        message = options["message"]

        if action == "info":
            self._info()
            return

        if action == "campaign":
            self._campaign(target)
            return

        if not target:
            self.stderr.write(self.style.ERROR(f"phone_number is required for action '{action}'."))
            return

        phone_number = target
        provider = CheapestTextingProvider()
        self.stdout.write(f"Base URL      : {provider.base_url}")
        self.stdout.write(f"Campaign ID   : {provider.campaign_id}")
        self.stdout.write(f"Trunk number  : {provider.trunk_number}")
        self.stdout.write("")

        try:
            if action == "send":
                result = provider.send_message(phone_number, message)
                self.stdout.write(f"  Success      : {result.success}")
                self.stdout.write(f"  Message ID   : {result.provider_message_id}")
                self.stdout.write(self.style.SUCCESS("  Send OK"))
            elif action == "subscribe":
                status = provider.subscribe(phone_number)
                self.stdout.write(self.style.SUCCESS(f"  Subscribed → {status.value}"))
            elif action == "unsubscribe":
                status = provider.unsubscribe(phone_number)
                self.stdout.write(self.style.SUCCESS(f"  Unsubscribed → {status.value}"))
            elif action == "status":
                status = provider.get_subscription_status(phone_number)
                self.stdout.write(self.style.SUCCESS(f"  Status → {status.value}"))
            elif action == "create-contact":
                contact = Contact(
                    phone_number=phone_number,
                    first_name=options["first_name"],
                    last_name=options["last_name"],
                    email=options["email"],
                )
                contact = provider.create_contact(contact)
                self.stdout.write(f"  External ID  : {contact.external_id}")
                self.stdout.write(self.style.SUCCESS("  Contact upserted (attached to campaign)."))
            elif action == "remove-contact":
                provider.remove_contact(phone_number)
                self.stdout.write(self.style.SUCCESS("  Contact removed from campaign."))
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))

    def _info(self) -> None:
        """Discover trunk numbers and campaigns using only the API key."""
        api_key = settings.CHEAPEST_TEXTING_API_KEY
        base_url = settings.CHEAPEST_TEXTING_BASE_URL

        if not api_key:
            self.stderr.write(self.style.ERROR("CHEAPEST_TEXTING_API_KEY is not set."))
            return

        client = httpx.Client(
            base_url=base_url,
            headers={"X-API-KEY": api_key},
            timeout=30.0,
        )

        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /user/info/ ---"))
        try:
            r = client.get("/user/info/")
            r.raise_for_status()
            user_info_raw = r.json()
        except httpx.HTTPError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))
            return

        # Endpoint returns a list with a single user object.
        user_info = user_info_raw[0] if isinstance(user_info_raw, list) and user_info_raw else user_info_raw
        self.stdout.write(json.dumps(user_info, indent=2, default=str))

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("--- Trunk numbers ---"))
        trunks = []
        for sub in user_info.get("active_subscriptions") or []:
            for tn in sub.get("trunk_numbers") or []:
                trunks.append(tn)
                self.stdout.write(f"  id={tn.get('id')}  phone={tn.get('phone')}  type={tn.get('number_type', '')}")
        if not trunks:
            self.stdout.write("  (none found)")

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /campaigns/ ---"))
        try:
            r = client.get("/campaigns/")
            r.raise_for_status()
            campaigns = r.json()
        except httpx.HTTPError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))
            return

        # Response may be a list or a paginated object with "results".
        items = campaigns.get("results") if isinstance(campaigns, dict) else campaigns
        for c in items or []:
            cid = c.get("id") or c.get("pk")
            self.stdout.write(f"  id={cid}  keyword={c.get('keyword')}  subscribers={c.get('subscribers_count', '?')}")
        if not items:
            self.stdout.write("  (none found)")

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Set CHEAPEST_TEXTING_TRUNK_NUMBER and CHEAPEST_TEXTING_CAMPAIGN_ID in your .env.local "
                "using the IDs above, then re-run with action=send/subscribe/etc."
            )
        )

    def _campaign(self, campaign_id_arg: str | None) -> None:
        """Fetch and print a single campaign by ID (only needs API key)."""
        api_key = settings.CHEAPEST_TEXTING_API_KEY
        base_url = settings.CHEAPEST_TEXTING_BASE_URL

        if not api_key:
            self.stderr.write(self.style.ERROR("CHEAPEST_TEXTING_API_KEY is not set."))
            return

        if campaign_id_arg:
            try:
                campaign_id = int(campaign_id_arg)
            except ValueError:
                self.stderr.write(self.style.ERROR(f"Invalid campaign ID: {campaign_id_arg!r}"))
                return
        elif settings.CHEAPEST_TEXTING_CAMPAIGN_ID:
            campaign_id = settings.CHEAPEST_TEXTING_CAMPAIGN_ID
        else:
            self.stderr.write(
                self.style.ERROR(
                    "Pass a campaign ID as the second positional argument, "
                    "or set CHEAPEST_TEXTING_CAMPAIGN_ID in your env."
                )
            )
            return

        client = httpx.Client(
            base_url=base_url,
            headers={"X-API-KEY": api_key},
            timeout=30.0,
        )

        self.stdout.write(self.style.MIGRATE_HEADING(f"--- GET /campaigns/{campaign_id}/ ---"))
        try:
            r = client.get(f"/campaigns/{campaign_id}/")
            r.raise_for_status()
        except httpx.HTTPError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))
            return

        self.stdout.write(json.dumps(r.json(), indent=2, default=str))
