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

from accounts.models import User
from common.enums import SelahTeamEnum
from django.core.management.base import BaseCommand
from django.utils import timezone
from notes.enums import ServiceRequestStatusEnum
from notes.models import (
    Note,
    OrganizationService,
    OrganizationServiceCategory,
    ServiceRequest,
)
from organizations.models import Organization

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

TEAMS = list(SelahTeamEnum)


class Command(BaseCommand):
    help = "Load realistic test data for reports (Notes with teams, purposes, services) into test_org."

    def add_arguments(self, parser):
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

    def handle(self, *args, **options):
        # Find test_org
        try:
            org = Organization.objects.get(name="test_org")
        except Organization.DoesNotExist:
            self.stderr.write(self.style.ERROR(
                "Organization 'test_org' not found. Make sure IS_LOCAL_DEV is True and migrations have run."
            ))
            return

        # Find a user in the org to use as created_by
        user = User.objects.filter(organizations_organization__in=[org]).first()
        if not user:
            self.stderr.write(self.style.ERROR("No users found in test_org."))
            return

        if options["clear"]:
            count, _ = Note.objects.filter(organization=org).delete()
            self.stdout.write(self.style.WARNING(f"Deleted {count} existing objects for test_org."))

        num_notes = options["notes"]

        # 1. Create service categories and services
        self.stdout.write("Creating service categories and services...")
        services = self._create_services(org)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(services)} services in {len(SERVICE_CATEGORIES)} categories."))

        # 2. Create notes spread across the last 3 months
        self.stdout.write(f"Creating {num_notes} notes...")
        now = timezone.now()
        three_months_ago = now - timedelta(days=90)

        notes_created = 0
        for i in range(num_notes):
            # Random date in the last 90 days
            random_days = random.randint(0, 90)
            random_hours = random.randint(8, 20)  # business hours
            interaction_date = three_months_ago + timedelta(days=random_days, hours=random_hours)

            team = random.choice(TEAMS)
            purpose = random.choice(PURPOSES)

            note = Note.objects.create(
                organization=org,
                created_by=user,
                interacted_at=interaction_date,
                team=team,
                purpose=purpose,
                is_submitted=True,
                public_details=f"Test interaction #{i + 1} - {purpose} by {team.label}",
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
                        status=random.choice([
                            ServiceRequestStatusEnum.TO_DO,
                            ServiceRequestStatusEnum.COMPLETED,
                        ]),
                        created_by=user,
                    )
                    note.requested_services.add(sr)

            notes_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {notes_created} notes for test_org spanning the last 90 days."
        ))
        self.stdout.write(f"  Date range: {three_months_ago.date()} to {now.date()}")
        self.stdout.write(f"  Teams used: {len(TEAMS)}")
        self.stdout.write(f"  Purposes used: {len(PURPOSES)}")
        self.stdout.write(f"  Services available: {len(services)}")

    def _create_services(self, org):
        """Create service categories and services, reusing existing ones."""
        all_services = []
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
                    defaults={"category": category, "priority": idx},
                )
                all_services.append(svc)
        return all_services
                    defaults={"category": category, "priority": idx},
                )
                all_services.append(svc)
        return all_services
