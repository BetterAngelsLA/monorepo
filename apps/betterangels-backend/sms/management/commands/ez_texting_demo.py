"""
Demo command to test the EZ Texting SMS provider.

Discovery (only requires EZ_TEXTING_APP_KEY / EZ_TEXTING_APP_SECRET):
    # List contact groups so you can populate EZ_TEXTING_GROUP_ID (optional).
    python manage.py ez_texting_demo info

Once credentials are configured:
    python manage.py ez_texting_demo create-contact +13232066439 --first-name Joe --last-name Smith
    python manage.py ez_texting_demo send +13232066439
    python manage.py ez_texting_demo subscribe +13232066439
    python manage.py ez_texting_demo status +13232066439
    python manage.py ez_texting_demo unsubscribe +13232066439
    python manage.py ez_texting_demo remove-contact +13232066439
"""

import json
from typing import Any

import httpx
from django.conf import settings
from django.core.management.base import BaseCommand, CommandParser
from sms.errors import ProviderError
from sms.providers.ez_texting import EzTextingProvider
from sms.types import Contact


class Command(BaseCommand):
    help = "Demo the EZ Texting SMS provider."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "action",
            choices=[
                "info",
                "send",
                "subscribe",
                "unsubscribe",
                "status",
                "create-contact",
                "remove-contact",
            ],
            help="Action to perform.",
        )
        parser.add_argument(
            "target",
            nargs="?",
            default=None,
            help="Phone number in E.164 format. Not used by 'info'.",
        )
        parser.add_argument(
            "--message",
            default="Hello from Better Angels! This is an EZ Texting test message.",
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

        if not target:
            self.stderr.write(self.style.ERROR(f"phone_number is required for action '{action}'."))
            return

        phone_number = target
        provider = EzTextingProvider()
        self.stdout.write(f"Base URL : {provider.base_url}")
        self.stdout.write(f"Group ID : {provider.group_id or '(unset)'}")
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
                self.stdout.write(self.style.SUCCESS("  Contact upserted."))
            elif action == "remove-contact":
                provider.remove_contact(phone_number)
                self.stdout.write(self.style.SUCCESS("  Contact removed."))
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))

    def _info(self) -> None:
        """Discover account info and contact groups using only the credentials."""
        app_key = settings.EZ_TEXTING_APP_KEY
        app_secret = settings.EZ_TEXTING_APP_SECRET
        base_url = settings.EZ_TEXTING_BASE_URL

        if not app_key or not app_secret:
            self.stderr.write(self.style.ERROR("EZ_TEXTING_APP_KEY and EZ_TEXTING_APP_SECRET must be set."))
            return

        client = httpx.Client(
            base_url=base_url,
            auth=httpx.BasicAuth(app_key, app_secret),
            headers={"Accept": "application/json"},
            timeout=30.0,
        )

        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /credits/balance ---"))
        try:
            r = client.get("/credits/balance")
            r.raise_for_status()
            self.stdout.write(json.dumps(r.json(), indent=2, default=str))
        except httpx.HTTPError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /groups ---"))
        try:
            r = client.get("/groups")
            r.raise_for_status()
            data = r.json()
        except httpx.HTTPError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))
            return

        items = data.get("data") if isinstance(data, dict) else data
        for g in items or []:
            self.stdout.write(f"  id={g.get('id')}  name={g.get('name')}  members={g.get('membersCount', '?')}")
        if not items:
            self.stdout.write("  (none found)")

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Optionally set EZ_TEXTING_GROUP_ID in your .env.local using a group ID above, "
                "then re-run with action=send/subscribe/etc."
            )
        )
