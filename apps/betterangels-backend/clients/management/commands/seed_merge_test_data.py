"""
Management command to seed the database with test data for the client merge feature.

Creates groups of "duplicate" profiles with slight name/email variations
and all associated relations (notes, contacts, documents, HMIS profiles, etc.)
so you can exercise the merge tool end-to-end.

Usage:
    python manage.py seed_merge_test_data
    python manage.py seed_merge_test_data --clear   # delete previous test data first
"""

from __future__ import annotations

import random
from datetime import date, timedelta

from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import User
from clients.enums import HmisAgencyEnum, LivingSituationEnum, RaceEnum
from clients.models import (
    ClientContact,
    ClientHouseholdMember,
    ClientProfile,
    HmisProfile,
    SocialMediaProfile,
)
from common.models import Attachment, PhoneNumber
from model_bakery import baker
from notes.enums import ServiceRequestStatusEnum
from notes.models import Note, ServiceRequest
from organizations.models import Organization
from teams.models import Team

# ---------------------------------------------------------------------------
# Duplicate group scenarios — realistic names you'd actually need to merge
# ---------------------------------------------------------------------------

DUPLICATE_GROUPS: list[dict] = [
    {
        "label": "Tod Johnson — 3 variants",
        "target": {
            "first_name": "Todd",
            "last_name": "Johnson",
            "email": "todd.johnson@example.com",
            "california_id": "J1234567",
            "date_of_birth": date(1985, 3, 15),
            "nickname": "Tod",
            "living_situation": LivingSituationEnum.SHELTER,
            "race": RaceEnum.WHITE_CAUCASIAN,
            "preferred_language": None,  # test null fill
        },
        "sources": [
            {
                "first_name": "Tod",
                "last_name": "Johnson",
                "email": "tod.j@example.com",
                "date_of_birth": date(1985, 3, 15),
                "nickname": None,
                "living_situation": LivingSituationEnum.OPEN_AIR,
                "race": None,  # should be filled from another source
            },
            {
                "first_name": "Todd",
                "last_name": "Jonson",
                "email": None,  # test null fill scenario
                "date_of_birth": None,  # test null fill
                "nickname": "TJ",
                "living_situation": None,
                "race": RaceEnum.WHITE_CAUCASIAN,
            },
        ],
    },
    {
        "label": "Maria Garcia — 2 variants",
        "target": {
            "first_name": "Maria",
            "last_name": "Garcia",
            "email": "maria.garcia@example.com",
            "california_id": "G7654321",
            "date_of_birth": date(1992, 7, 22),
            "nickname": None,
            "living_situation": LivingSituationEnum.TENT,
            "race": RaceEnum.HISPANIC_LATINO,
        },
        "sources": [
            {
                "first_name": "Maria",
                "last_name": "Garci",
                "email": "mgarcia@example.com",
                "date_of_birth": date(1992, 7, 22),
                "nickname": "Mari",
                "living_situation": None,
                "race": RaceEnum.HISPANIC_LATINO,
            },
        ],
    },
    {
        "label": "Robert Williams — 2 variants with conflict on email",
        "target": {
            "first_name": "Robert",
            "last_name": "Williams",
            "email": "bob.williams@example.com",
            "california_id": "W1112223",
            "date_of_birth": date(1978, 11, 3),
            "nickname": "Bob",
            "living_situation": LivingSituationEnum.VEHICLE,
            "race": None,
        },
        "sources": [
            {
                "first_name": "Rob",
                "last_name": "Williams",
                "email": "rob.w@example.com",  # will conflict
                "date_of_birth": None,
                "nickname": None,
                "living_situation": None,  # will be filled from target
                "race": RaceEnum.BLACK_AFRICAN_AMERICAN,
            },
        ],
    },
    {
        "label": "Clean merge example — 2 variants, no conflicts",
        "target": {
            "first_name": "Sarah",
            "last_name": "Chen",
            "email": "sarah.chen@example.com",
            "california_id": "C9876543",
            "date_of_birth": date(1988, 5, 10),
            "nickname": None,
            "living_situation": LivingSituationEnum.TENT,
            "race": RaceEnum.ASIAN,
        },
        "sources": [
            {
                "first_name": "Sara",
                "last_name": "Chen",
                "email": None,
                "date_of_birth": date(1988, 5, 10),
                "nickname": "S",
                "living_situation": None,
                "race": None,
            },
        ],
    },
    {
        "label": "James Smith — 3 variants all different emails",
        "target": {
            "first_name": "James",
            "last_name": "Smith",
            "email": "james.smith@example.com",
            "california_id": "S5556667",
            "date_of_birth": date(1965, 1, 20),
            "nickname": "Jim",
            "living_situation": LivingSituationEnum.OPEN_AIR,
            "race": RaceEnum.WHITE_CAUCASIAN,
        },
        "sources": [
            {
                "first_name": "Jim",
                "last_name": "Smith",
                "email": "jim.smith@oldmail.com",
                "date_of_birth": date(1965, 1, 20),
                "nickname": None,
                "living_situation": None,
                "race": None,
            },
            {
                "first_name": "James",
                "last_name": "Smyth",
                "email": "jsmyth@example.com",
                "date_of_birth": None,
                "nickname": "Jimmy",
                "living_situation": LivingSituationEnum.SHELTER,
                "race": RaceEnum.WHITE_CAUCASIAN,
            },
        ],
    },
]


class Command(BaseCommand):
    help = "Seed database with realistic test data for the client merge feature."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing test profiles (email ending in @example.com) before seeding.",
        )

    def handle(self, **options):
        if options["clear"]:
            self._clear_existing()

        # Get or create shared org / team / user for Notes
        org = self._get_or_create_org()
        team = self._get_or_create_team(org)
        user = self._get_or_create_user()
        content_type = ContentType.objects.get_for_model(ClientProfile)

        total_profiles = 0
        groups_summary: list[str] = []

        for group in DUPLICATE_GROUPS:
            label = group["label"]
            self.stdout.write(f"\n🔀 Creating group: {label}")

            # Create target
            target_fields = dict(group["target"])
            email = target_fields.pop("email", None)
            california_id = target_fields.pop("california_id", None)
            if email:
                target_fields["email"] = email
            if california_id:
                target_fields["california_id"] = california_id

            target = baker.make(ClientProfile, **target_fields)
            self._add_relations(target, org, team, user, content_type)
            self.stdout.write(f"   ✅ Target:  {target.full_name} (#{target.pk}) — {target.email or 'no email'}")

            source_pks: list[int] = []

            # Create sources
            for src in group["sources"]:
                src_fields = {"email": None, "california_id": None, **src}
                source = baker.make(ClientProfile, **src_fields)
                self._add_relations(source, org, team, user, content_type)
                source_pks.append(source.pk)
                self.stdout.write(f"   📋 Source:  {source.full_name} (#{source.pk}) — {source.email or 'no email'}")

            groups_summary.append(f"  {label}: target=#{target.pk}, sources={source_pks}")
            total_profiles += 1 + len(group["sources"])

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Seeded {total_profiles} profiles in {len(DUPLICATE_GROUPS)} duplicate groups.")
        )
        self.stdout.write("\n📋 Summary — use these IDs in the merge tool:")
        for summary in groups_summary:
            self.stdout.write(summary)
        self.stdout.write("\n🔗 Merge Tool: /admin/clients/clientprofile/merge/")

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _add_relations(
        self,
        client: ClientProfile,
        org: Organization,
        team: Team,
        user: User,
        content_type: ContentType,
    ) -> None:
        """Attach all related objects to a profile (mirrors test _make_client)."""
        # FK relations
        baker.make(HmisProfile, client_profile=client, hmis_id=f"HMIS-{client.pk}", agency=HmisAgencyEnum.LAHSA)
        baker.make(SocialMediaProfile, client_profile=client)
        baker.make(ClientContact, client_profile=client, name=f"Contact-{client.pk}")
        baker.make(ClientHouseholdMember, client_profile=client, name=f"HH-{client.pk}")

        # Notes
        for _ in range(random.randint(1, 4)):
            baker.make(
                Note,
                client_profile=client,
                organization=org,
                team=team,
                created_by=user,
                interacted_at=timezone.now() - timedelta(days=random.randint(1, 90)),
                purpose=random.choice(
                    [
                        "Outreach",
                        "Follow-up",
                        "Case Management",
                        "Wellness Check",
                        "Housing Assessment",
                        "Resource Referral",
                    ]
                ),
            )

        # ServiceRequests
        for _ in range(random.randint(0, 2)):
            baker.make(
                ServiceRequest,
                client_profile=client,
                status=random.choice([ServiceRequestStatusEnum.TO_DO, ServiceRequestStatusEnum.COMPLETED]),
                created_by=user,
            )

        # GFK relations
        fake_file = SimpleUploadedFile(name=f"doc_{client.pk}.pdf", content=b"test", content_type="application/pdf")
        for _ in range(random.randint(1, 3)):
            Attachment.objects.create(
                file=fake_file,
                content_type=content_type,
                object_id=client.pk,
                mime_type="application/pdf",
                attachment_type="DOCUMENT",
            )

        PhoneNumber.objects.create(
            number=f"+1212555{client.pk:04d}"[:16],
            content_type=content_type,
            object_id=client.pk,
        )

    def _get_or_create_org(self) -> Organization:
        org, _ = Organization.objects.get_or_create(
            name="Merge Test Org",
            defaults={"is_active": True},
        )
        return org

    def _get_or_create_team(self, org: Organization) -> Team:
        team, _ = Team.objects.get_or_create(
            name="Merge Test Team",
            organization=org,
        )
        return team

    def _get_or_create_user(self) -> User:
        user, _ = User.objects.get_or_create(
            username="merge_test_user",
            defaults={
                "email": "merge_test@example.com",
                "is_staff": True,
            },
        )
        return user

    def _clear_existing(self) -> None:
        """Delete all test profiles (identified by @example.com email or merge test user)."""
        qs = ClientProfile.objects.filter(email__endswith="@example.com") | ClientProfile.objects.filter(
            email__isnull=True,
            first_name__in=[
                "Todd",
                "Tod",
                "Maria",
                "Robert",
                "Rob",
                "Sarah",
                "Sara",
                "James",
                "Jim",
            ],
        )
        count = qs.count()
        qs.delete()
        self.stdout.write(self.style.WARNING(f"🗑️  Deleted {count} existing test profiles."))
