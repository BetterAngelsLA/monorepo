"""
Management command to load realistic test data for the reports feature.

Creates Notes with various teams, purposes, dates, and services
attached to the 'test_org' organization so you can test the CSV export
and the GraphQL report summary (charts/rollups).

Usage:
    python manage.py load_report_test_data
    python manage.py load_report_test_data --clear   # delete existing test data first
"""

import random
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.contrib.gis.geos import Point
from django.core.management.base import BaseCommand, CommandError, CommandParser
from django.utils import timezone
from organizations.models import Organization

from accounts.models import User
from clients.models import ClientProfile
from common.models import Location
from notes.enums import ServiceRequestStatusEnum
from notes.models import (
    Note,
    OrganizationService,
    OrganizationServiceCategory,
    ServiceRequest,
)
from teams.models import Team

PURPOSES = [
    "Outreach",
    "Follow-up",
    "Case Management",
    "Wellness Check",
    "Resource Referral",
    "Housing Assessment",
    "Medical Follow-up",
    "Employment Assistance",
    "Legal Aid Referral",
    "Crisis Intervention",
]

SERVICE_CATEGORIES = {
    "Basic Needs": [
        "Food / Meals",
        "Water",
        "Blankets / Sleeping Bags",
        "Hygiene Kits",
        "Clothing",
        "Shoes",
        "Tents / Tarps",
    ],
    "Health": [
        "First Aid",
        "Wound Care",
        "Naloxone Distribution",
        "Mental Health Referral",
        "Substance Abuse Referral",
        "Medical Transport",
        "Vision / Dental Referral",
    ],
    "Housing": [
        "Shelter Referral",
        "Housing Navigation",
        "Rapid Re-Housing",
        "Permanent Supportive Housing",
        "Transitional Housing",
    ],
    "Benefits & Documents": [
        "ID / Birth Certificate",
        "SSI / SSDI Assistance",
        "CalFresh / EBT",
        "Medi-Cal Enrollment",
        "Veterans Benefits",
    ],
    "Other Support": [
        "Legal Services",
        "Employment Support",
        "Transportation (Bus Pass)",
        "Phone / Communication",
        "Mail Services",
        "Storage",
    ],
}

FIRST_NAMES = [
    "Alex",
    "Jordan",
    "Sam",
    "Taylor",
    "Morgan",
    "Casey",
    "Riley",
    "Jamie",
    "Avery",
    "Quinn",
    "Cameron",
    "Dakota",
    "Rowan",
    "Hayden",
    "Reese",
    "Finley",
    "Emerson",
    "Skyler",
    "River",
    "Drew",
    "Charlie",
    "Phoenix",
    "Sage",
    "Kai",
    "Blake",
    "Remy",
    "Justice",
    "Lennox",
    "Frankie",
    "Indigo",
    "Harley",
    "Ellis",
    "Oakley",
    "Arden",
    "Shiloh",
    "Marlowe",
    "Leighton",
    "Kendall",
    "Peyton",
    "Micah",
]

LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
]

#: Where ``--with-locations`` puts the interactions it creates. Real places rather than random
#: points, so the region report is readable: each row is a landmark a reviewer recognises and can
#: check against a map. Random coordinates would fill the report with numbers nobody can verify.
#:
#: The set is chosen so that every dimension has something in it **and** something outside it.
#: Long Beach, Santa Monica and Beverly Hills are cities of their own, so they carry no LA city
#: council district; Florence-Firestone is unincorporated, so it is in no city at all. A set drawn
#: only from LA proper would never exercise the unassigned buckets, which are a feature of the
#: report rather than an edge case. Coordinates are checked against the imported layers — a
#: re-import from a newer vintage can move a district line out from under one of them.
SAMPLE_POINTS = [
    (-118.2437, 34.0522),  # Downtown LA
    (-118.3287, 34.0928),  # Hollywood
    (-118.1912, 34.1114),  # Highland Park
    (-118.4517, 34.2011),  # Van Nuys
    (-118.2431, 33.9425),  # Watts
    (-118.5412, 34.0483),  # Pacific Palisades
    (-118.1937, 33.7701),  # Long Beach — its own city, so no LA council district
    (-118.4965, 34.0195),  # Santa Monica — likewise
    (-118.4004, 34.0736),  # Beverly Hills — likewise
    (-118.2467, 33.9750),  # Florence-Firestone — unincorporated: in no city at all
]

# Seed teams for local dev, created via get_or_create so the command is
# self-contained and re-runnable.
SEED_TEAMS = [
    "Morning Outreach",
    "Evening Outreach",
    "Drop-in Center",
    "Street Medicine",
    "Housing Navigation",
    "Shelter Operations",
]


class Command(BaseCommand):
    help = "Load realistic test data for reports (Notes with teams, purposes, services) into test_org."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing Notes for test_org before loading.",
        )
        parser.add_argument(
            "--notes",
            type=int,
            default=200,
            help="Number of notes to create (default: 200).",
        )
        parser.add_argument(
            "--with-locations",
            action="store_true",
            help=(
                "Give nine notes in ten a Location at one of SAMPLE_POINTS, so the region report, "
                "map and heatmap have interactions to place. Off by default: this command also "
                "seeds the CSV export and the chart rollups, which do not want points. The "
                "remaining tenth are left without one, because 'No location recorded' is a bucket "
                "the region report has to show."
            ),
        )

    def handle(self, *args: Any, **options: Any) -> None:
        # Refuse outside local dev, explicitly. The command seeds Notes and, with `--clear`,
        # deletes every note belonging to `test_org`; relying on that organization not existing
        # is not a safety property, it is a coincidence of the production data.
        if not settings.IS_LOCAL_DEV:
            raise CommandError(
                "load_report_test_data writes test notes and deletes them with --clear; "
                "it runs only when IS_LOCAL_DEV is True."
            )

        # Find test_org
        try:
            org = Organization.objects.get(name="test_org")
        except Organization.DoesNotExist:
            self.stderr.write(
                self.style.ERROR(
                    "Organization 'test_org' not found. Make sure IS_LOCAL_DEV is True and migrations have run."
                )
            )
            return

        # Find a user in the org to use as created_by
        user = User.objects.filter(organizations_organization__in=[org]).first()
        if not user:
            self.stderr.write(self.style.ERROR("No users found in test_org."))
            return

        if options["clear"]:
            count, _ = Note.objects.filter(organization=org).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing objects for test_org."))

        teams = []
        for team_name in SEED_TEAMS:
            team, _ = Team.objects.get_or_create(name=team_name, organization=org)
            teams.append(team)

        num_notes = options["notes"]

        # 1. Create service categories and services
        self.stdout.write("Creating service categories and services...")
        services = self._create_services(org)
        self.stdout.write(
            self.style.SUCCESS(f"  Created {len(services)} services in {len(SERVICE_CATEGORIES)} categories.")
        )

        # 2. Create a pool of client profiles (~50 unique clients)
        num_clients = min(50, num_notes)
        self.stdout.write(f"Creating {num_clients} client profiles...")
        clients = self._create_client_profiles(num_clients, user)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(clients)} client profiles."))

        # 3. Create notes spread across the last 3 months
        self.stdout.write(f"Creating {num_notes} notes...")
        now = timezone.now()
        three_months_ago = now - timedelta(days=90)

        notes_created = 0
        for i in range(num_notes):
            # Random date in the last 90 days
            random_days = random.randint(0, 90)
            random_hours = random.randint(8, 20)  # business hours
            interaction_date = three_months_ago + timedelta(days=random_days, hours=random_hours)

            team = random.choice(teams)
            purpose = random.choice(PURPOSES)

            # `get_or_create_location`, not `Location.objects.create`: it is the path a real
            # interaction takes (common/models.py), so the seed data dedupes and rounds exactly
            # as production rows do. One note in ten keeps `location=None`.
            location = None
            if options["with_locations"] and i % 10 != 0:
                lon, lat = random.choice(SAMPLE_POINTS)
                location = Location.get_or_create_location({"point": Point(lon, lat, srid=4326)})

            note = Note.objects.create(
                organization=org,
                created_by=user,
                interacted_at=interaction_date,
                team=team,
                purpose=purpose,
                is_submitted=True,
                public_details=f"Test interaction #{i + 1} - {purpose} by {team.name}",
                client_profile=random.choice(clients),
                location=location,
            )

            # Add provided services (1-4 random services)
            num_provided = random.randint(1, 4)
            provided_svcs = random.sample(services, min(num_provided, len(services)))
            for svc in provided_svcs:
                sr = ServiceRequest.objects.create(
                    service=svc,
                    status=ServiceRequestStatusEnum.COMPLETED,
                    created_by=user,
                )
                note.provided_services.add(sr)

            # Add requested services (0-3 random services) — ~60% of notes
            if random.random() < 0.6:
                num_requested = random.randint(1, 3)
                requested_svcs = random.sample(services, min(num_requested, len(services)))
                for svc in requested_svcs:
                    sr = ServiceRequest.objects.create(
                        service=svc,
                        status=random.choice(
                            [
                                ServiceRequestStatusEnum.TO_DO,
                                ServiceRequestStatusEnum.COMPLETED,
                            ]
                        ),
                        created_by=user,
                    )
                    note.requested_services.add(sr)

            notes_created += 1

        self.stdout.write(
            self.style.SUCCESS(f"\nDone! Created {notes_created} notes for test_org spanning the last 90 days.")
        )
        if options["with_locations"]:
            placed = Note.objects.filter(organization=org, location__isnull=False).count()
            self.stdout.write(
                f"  With locations: {placed} notes carry a point, so the region report, map and "
                "heatmap have interactions to place."
            )
            self.stdout.write("  The rest are the 'No location recorded' bucket the report must also show.")
        self.stdout.write(f"  Date range: {three_months_ago.date()} to {now.date()}")
        self.stdout.write(f"  Teams used: {len(teams)}")
        self.stdout.write(f"  Purposes used: {len(PURPOSES)}")
        self.stdout.write(f"  Services available: {len(services)}")
        self.stdout.write(f"  Unique clients: {len(clients)}")

    def _create_client_profiles(self, count: int, user: User) -> list[ClientProfile]:
        """Create a pool of client profiles with random names."""
        profiles: list[ClientProfile] = []
        for _ in range(count):
            profile = ClientProfile.objects.create(
                first_name=random.choice(FIRST_NAMES),
                last_name=random.choice(LAST_NAMES),
            )
            profiles.append(profile)
        return profiles

    def _create_services(self, org: Organization) -> list[OrganizationService]:
        """Create service categories and services, reusing existing ones."""
        all_services: list[OrganizationService] = []
        for cat_name, svc_labels in SERVICE_CATEGORIES.items():
            category, _ = OrganizationServiceCategory.objects.get_or_create(
                name=cat_name,
                organization=org,
            )
            for idx, label in enumerate(svc_labels):
                svc, _ = OrganizationService.objects.get_or_create(
                    label=label,
                    organization=org,
                    defaults={"category": category, "priority": idx},
                )
                all_services.append(svc)
        return all_services
