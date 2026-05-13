"""
Demo command to test the EZ Texting SMS provider.

Discovery (only requires EZ_TEXTING_APP_KEY / EZ_TEXTING_APP_SECRET):
    # List contact groups so you can populate EZ_TEXTING_GROUP_ID (optional).
    python manage.py ez_texting_demo info

Once credentials are configured:
    # 1:1 contact / messaging
    python manage.py ez_texting_demo create-contact +13232066439 --first-name Joe --last-name Smith
    python manage.py ez_texting_demo send +13232066439
    python manage.py ez_texting_demo subscribe +13232066439
    python manage.py ez_texting_demo status +13232066439
    python manage.py ez_texting_demo unsubscribe +13232066439
    python manage.py ez_texting_demo remove-contact +13232066439

    # Group (campaign) management — a "group" maps to a campaign/event.
    python manage.py ez_texting_demo create-group "Test Hollywood June 5"
    python manage.py ez_texting_demo list-groups
    python manage.py ez_texting_demo add-to-group <group_id> +13232066439
    python manage.py ez_texting_demo list-group <group_id>
    python manage.py ez_texting_demo send-group <group_id> --message "Reminder: ..."
    python manage.py ez_texting_demo remove-from-group <group_id> +13232066439
    python manage.py ez_texting_demo delete-group <group_id>
"""

import json
from typing import Any

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
                "create-group",
                "delete-group",
                "list-groups",
                "list-group",
                "add-to-group",
                "remove-from-group",
                "send-group",
            ],
            help="Action to perform.",
        )
        parser.add_argument(
            "params",
            nargs="*",
            help=(
                "Positional args, action-dependent:\n"
                "  send/subscribe/unsubscribe/status/create-contact/remove-contact: <phone>\n"
                "  create-group: <name>\n"
                "  delete-group/list-group: <group_id>\n"
                "  add-to-group/remove-from-group: <group_id> <phone>\n"
                "  send-group: <group_id>\n"
                "  info/list-groups: (no args)"
            ),
        )
        parser.add_argument(
            "--message",
            default="Hello from Better Angels! This is an EZ Texting test message.",
            help="Custom message body for send / send-group.",
        )
        parser.add_argument("--first-name", default="", help="First name (create-contact only).")
        parser.add_argument("--last-name", default="", help="Last name (create-contact only).")
        parser.add_argument("--email", default="", help="Email (create-contact only).")

    def handle(self, *args: Any, **options: Any) -> None:
        action = options["action"]
        extra: list[str] = options["params"]
        message = options["message"]

        if action == "info":
            self._info()
            return

        provider = EzTextingProvider()
        self.stdout.write(f"Base URL : {provider.base_url}")
        self.stdout.write(f"Group ID : {provider.group_id or '(unset)'}")
        self.stdout.write("")

        # Per-action positional arg expectations.
        phone_actions = {
            "send",
            "subscribe",
            "unsubscribe",
            "status",
            "create-contact",
            "remove-contact",
        }
        single_id_actions = {"delete-group", "list-group", "send-group"}
        group_and_phone_actions = {"add-to-group", "remove-from-group"}

        def _require(n: int, hint: str) -> bool:
            if len(extra) < n:
                self.stderr.write(self.style.ERROR(f"'{action}' requires: {hint}"))
                return False
            return True

        try:
            if action in phone_actions:
                if not _require(1, "<phone>"):
                    return
                phone_number = extra[0]
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
                    # Single call: GET /contacts/{phone} returns existence,
                    # optOut flag, and group memberships (with names) inline.
                    record = provider.get_contact(phone_number)
                    if record is None:
                        self.stdout.write(self.style.SUCCESS("  Status → not_found"))
                    else:
                        opted_out = bool(record.get("optOut"))
                        self.stdout.write(
                            self.style.SUCCESS(f"  Status → {'opted_out' if opted_out else 'subscribed'}")
                        )
                        groups = record.get("groups") or []
                        if groups:
                            self.stdout.write("")
                            self.stdout.write("  Member of groups:")
                            for g in groups:
                                self.stdout.write(f"    - id={g.get('id')}  name={g.get('name')}")
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

            elif action == "create-group":
                if not _require(1, "<name>"):
                    return
                name = " ".join(extra)
                group_id = provider.create_group(name)
                self.stdout.write(f"  Group ID     : {group_id}")
                self.stdout.write(self.style.SUCCESS(f"  Group '{name}' created."))

            elif action == "list-groups":
                groups = provider.list_groups()
                if not groups:
                    self.stdout.write("  (no groups)")
                for g in groups:
                    self.stdout.write(
                        f"  id={g.get('id')}  name={g.get('name')}  contacts={g.get('contactsCount', '?')}"
                    )

            elif action in single_id_actions:
                if not _require(1, "<group_id>"):
                    return
                group_id = extra[0]
                if action == "delete-group":
                    provider.delete_group(group_id)
                    self.stdout.write(self.style.SUCCESS(f"  Group {group_id} deleted."))
                elif action == "list-group":
                    group = provider.get_group(group_id)
                    self.stdout.write(json.dumps(group, indent=2, default=str))
                elif action == "send-group":
                    result = provider.send_to_group(group_id, message)
                    self.stdout.write(f"  Success      : {result.success}")
                    self.stdout.write(f"  Message ID   : {result.provider_message_id}")
                    self.stdout.write(self.style.SUCCESS("  Group send OK"))

            elif action in group_and_phone_actions:
                if not _require(2, "<group_id> <phone>"):
                    return
                group_id, phone_number = extra[0], extra[1]
                if action == "add-to-group":
                    provider.add_contact_to_group(phone_number, group_id)
                    self.stdout.write(self.style.SUCCESS(f"  Added {phone_number} → group {group_id}"))
                elif action == "remove-from-group":
                    provider.remove_contact_from_group(phone_number, group_id)
                    self.stdout.write(self.style.SUCCESS(f"  Removed {phone_number} from group {group_id}"))

        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))
        finally:
            self._dump_responses(provider)

    def _dump_responses(self, provider: EzTextingProvider) -> None:
        """Print every raw HTTP response made through the provider, then clear."""
        for response in provider.responses:
            self.stdout.write("")
            self.stdout.write(
                self.style.MIGRATE_HEADING(
                    f"--- raw response: {response.request.method} {response.request.url} "
                    f"({response.status_code}) ---"
                )
            )
            body = response.text
            if not body:
                self.stdout.write("  (empty body)")
                continue
            try:
                self.stdout.write(json.dumps(response.json(), indent=2, default=str))
            except ValueError:
                self.stdout.write(body)
        provider.responses.clear()

    def _info(self) -> None:
        """Discover account info and contact groups using only the credentials."""
        try:
            provider = EzTextingProvider()
        except ValueError as e:
            self.stderr.write(self.style.ERROR(str(e)))
            return

        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /credits ---"))
        try:
            r = provider._request("GET", "/credits")
            self.stdout.write(json.dumps(r.json(), indent=2, default=str))
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("--- GET /contact-groups ---"))
        try:
            groups = provider.list_groups()
            for g in groups:
                self.stdout.write(f"  id={g.get('id')}  name={g.get('name')}  contacts={g.get('contactsCount', '?')}")
            if not groups:
                self.stdout.write("  (no groups)")
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Failed: {e}"))

        self._dump_responses(provider)

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                "Optionally set EZ_TEXTING_GROUP_ID in your .env.local using a group ID above, "
                "then re-run with action=send/subscribe/etc."
            )
        )
