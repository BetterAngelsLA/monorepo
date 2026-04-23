"""
Demo command to test the Twilio SMS provider.

Usage:
    # Validate a phone number (Lookup API)
    python manage.py twilio_demo validate +13232066439

    # Send a test SMS
    python manage.py twilio_demo send +13232066439

    # Do both
    python manage.py twilio_demo both +13232066439
"""

from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from sms.errors import ProviderError
from sms.providers.twilio_provider import TwilioProvider


class Command(BaseCommand):
    help = "Demo the Twilio SMS provider: validate a number, send a test message, or both."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "action",
            choices=["validate", "send", "both"],
            help="Action to perform: validate, send, or both.",
        )
        parser.add_argument(
            "phone_number",
            help="Phone number in E.164 format (e.g. +13232066439).",
        )
        parser.add_argument(
            "--message",
            default="Hello from Better Angels! This is a Twilio test message.",
            help="Custom message body for send/both actions.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        action = options["action"]
        phone_number = options["phone_number"]
        message = options["message"]

        provider = TwilioProvider()
        self.stdout.write(f"Using Twilio from number: {provider.from_number}")
        self.stdout.write("")

        if action in ("validate", "both"):
            self._validate(provider, phone_number)

        if action in ("send", "both"):
            self._send(provider, phone_number, message)

    def _validate(self, provider: TwilioProvider, phone_number: str) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING(f"--- Validating {phone_number} ---"))
        try:
            result = provider.validate_phone_number(phone_number)
            self.stdout.write(f"  Phone number : {result.phone_number}")
            self.stdout.write(f"  Is valid     : {result.is_valid}")
            self.stdout.write(f"  In service   : {result.in_service}")
            self.stdout.write(f"  Phone type   : {result.phone_type.value}")
            self.stdout.write(f"  Carrier      : {result.carrier or '(unknown)'}")
            self.stdout.write(self.style.SUCCESS("  Validation OK"))
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Validation failed: {e}"))

    def _send(self, provider: TwilioProvider, phone_number: str, body: str) -> None:
        self.stdout.write(self.style.MIGRATE_HEADING(f"--- Sending SMS to {phone_number} ---"))
        self.stdout.write(f"  Message: {body}")
        try:
            result = provider.send_message(phone_number, body)
            self.stdout.write(f"  Success      : {result.success}")
            self.stdout.write(f"  Message SID  : {result.provider_message_id}")
            self.stdout.write(self.style.SUCCESS("  Send OK"))
        except ProviderError as e:
            self.stderr.write(self.style.ERROR(f"  Send failed: {e}"))
