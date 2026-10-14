"""Deterministic shelter records for referral match-tag testing.

The existing ``shelters/scripts/seed_shelters.py`` is faker-randomised: it calls
``make_complete_shelters``, which populates *every* attribute category on every
shelter. That is good for exercising the UI broadly, but it means two states of
the match-tag rule can never appear locally or on dev:

  * a need whose category the shelter reported but does not offer   (red fill)
  * a need whose category the shelter never reported at all         (red outline)

...because "never reported" does not occur in randomised data. This command adds
three *named, fixed* shelters chosen so that between them every tag state is
visible. Re-running updates them in place, preserving IDs and referral links.
Ownership is recorded in ReferralTestShelter, never inferred from a display name.
Older, unregistered fixtures are left untouched; inspect them separately rather
than automatically adopting or deleting records with similar names.

Usage (development only — the fixtures are APPROVED and non-private, so they
become publicly listed):

    python manage.py seed_referral_test_data
    python manage.py seed_referral_test_data --clear     # remove owned, unreferenced fixtures

The command refuses to run unless ``settings.DEBUG`` is true or the environment
variable ``REFERRAL_SEED_ALLOWED=true`` is set, because a deployed environment
must not publish these fixtures. The guard applies to ``--clear`` as well.

Development tooling: fixture construction reuses the shared test recipes, so the
command needs the dev dependency group (``model-bakery``) installed.

Client needs are entered per referral on the intake form, as multi-selects over
these same shelter enums (see clientNeeds.ts). The expectations printed below
assume Answer Set A from betterangels-notes/referral-test-brief.md:

    Cats / Single Women / Wheelchair Accessible

A different answer set colours the same shelters differently — that is the point
of having needs on the referral. Only pets, demographics and accessibility drive
tags, because Shelters.graphql returns only those three.
"""

import os
from functools import partial
from typing import Any

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from referrals.models import Referral, ReferralTestShelter
from shelters.enums import (
    AccessibilityChoices,
    DemographicChoices,
    PetChoices,
    StatusChoices,
)
from shelters.models import Shelter

# Display only. Ownership and cleanup use the registry, never this prefix.
NAME_PREFIX = "Shelter "

# Answer Set A from the test brief. Kept here only to document what the
# expectations below are computed against — needs are entered in the app, not seeded.
CLIENT_NEEDS = "Cats (pets) / Single Women (demographics) / Wheelchair Accessible (accessibility)"

SCENARIOS: list[dict[str, Any]] = [
    {
        "key": "match-all",
        "name": f"{NAME_PREFIX}One",
        # Every need met. The happy path a tester recognises immediately.
        "pets": [PetChoices.CATS, PetChoices.SERVICE_ANIMALS],
        "demographics": [DemographicChoices.SINGLE_WOMEN, DemographicChoices.FAMILIES],
        "accessibility": [
            AccessibilityChoices.WHEELCHAIR_ACCESSIBLE,
            AccessibilityChoices.ADA_ROOMS,
        ],
        "expect": [
            "green  fill    Cats",
            "green  fill    Single Women",
            "green  fill    Wheelchair Accessible",
            "no red tags, no notice",
            "collapsed      +3 more attributes",
        ],
    },
    {
        "key": "mixed-coverage",
        "name": f"{NAME_PREFIX}Two",
        # pets reported but no cats -> Cats is a CONFIRMED gap (red fill).
        # accessibility never reported -> Wheelchair Accessible is UNKNOWN (red outline).
        # demographics match -> Single Women is green.
        "pets": [PetChoices.DOGS_UNDER_25_LBS, PetChoices.PET_AREA],
        "demographics": [DemographicChoices.SINGLE_WOMEN],
        "accessibility": [],
        "expect": [
            "green  fill    Single Women",
            "red    fill    Cats                  (pets reported, cats absent)",
            "red    OUTLINE Wheelchair Accessible (accessibility never reported)",
            'notice         "Outlined needs were not reported by this shelter"',
            "collapsed      +2 more attributes",
        ],
    },
    {
        "key": "unreported",
        "name": f"{NAME_PREFIX}Three",
        # Reported nothing at all. Absence of data must not read as a mismatch.
        "pets": [],
        "demographics": [],
        "accessibility": [],
        "expect": [
            "red    OUTLINE Cats",
            "red    OUTLINE Single Women",
            "red    OUTLINE Wheelchair Accessible",
            'notice         "Outlined needs were not reported by this shelter"',
            "no +N toggle   (nothing to collapse)",
        ],
    },
]


class Command(BaseCommand):
    help = "Seed deterministic shelters that exercise every referral match-tag state."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete only registered fixtures, refusing if referrals still reference them.",
        )

    @transaction.atomic
    def handle(self, *args: Any, **options: Any) -> None:
        # These fixtures are APPROVED and non-private, so they are visible to every
        # client and in the public shelter directory. Refuse to run in anything that
        # is not an explicit development context.
        seed_allowed = settings.DEBUG or os.environ.get("REFERRAL_SEED_ALLOWED", "").strip().lower() == "true"
        if not seed_allowed:
            raise CommandError(
                "Refusing to create referral test fixtures: this command creates APPROVED, publicly "
                "listed shelters and is intended for development only. Set REFERRAL_SEED_ALLOWED=true "
                "(or run with DEBUG=true) to run it deliberately."
            )

        if options["clear"]:
            shelter_ids = list(ReferralTestShelter.objects.select_for_update().values_list("shelter_id", flat=True))
            # Lock shelters before checking references so a concurrent referral
            # cannot attach between the check and deletion (FK key-share lock).
            list(Shelter.objects.select_for_update().filter(pk__in=shelter_ids))
            if Referral.objects.filter(shelter_id__in=shelter_ids).exists():
                raise CommandError(
                    "Fixture shelters still have referrals. Remove those test referrals explicitly first."
                )
            removed = len(shelter_ids)
            Shelter.objects.filter(pk__in=shelter_ids).delete()
            self.stdout.write(self.style.WARNING(f"Removed {removed} seeded record(s). Nothing recreated."))
            return

        self.stdout.write(f"\nExpectations below assume Answer Set A: {CLIENT_NEEDS}\n")

        for scenario in SCENARIOS:
            # The callable runs inside get_or_create's transaction only when a
            # registry entry is absent. A uniqueness race rolls back its shelter
            # too, instead of leaving an unowned duplicate behind.
            defaults: dict[str, Any] = {"shelter": partial(self._build, scenario)}
            fixture, _ = ReferralTestShelter.objects.select_for_update().get_or_create(
                key=scenario["key"], defaults=defaults
            )
            shelter = fixture.shelter
            shelter.name = scenario["name"]
            shelter.status = StatusChoices.APPROVED
            shelter.is_private = False
            shelter.save(update_fields=["name", "status", "is_private", "updated_at"])
            for field in ("pets", "demographics", "accessibility"):
                manager = getattr(shelter, field)
                manager.set([manager.model.objects.get_or_create(name=value)[0] for value in scenario[field]])
            self.stdout.write(self.style.SUCCESS(f"\n{shelter.name}"))
            for line in scenario["expect"]:
                self.stdout.write(f"    {line}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\n\nSeeded {len(SCENARIOS)} shelters. They appear in the referral shelter picker for any client.\n"
            )
        )

    def _build(self, scenario: dict[str, Any]) -> Shelter:
        # Dev-only tooling: the factory lives with the test recipes and imports
        # model-bakery (dev dependency group). Import it lazily so a deployment
        # without dev dependencies fails with a clear message instead of an
        # import error, and so this module never hard-depends on test code.
        try:
            from shelters.tests.baker_recipes import make_complete_shelters
        except ImportError as exc:  # pragma: no cover - exercised only without dev deps
            raise CommandError(
                "seed_referral_test_data requires the dev dependency group (model-bakery). "
                "Run it from a development environment where dev dependencies are installed."
            ) from exc
        # Reuse the tested recipe so every required field, photo and schedule is
        # populated the same way as the randomised seed, then override only the
        # three attribute categories the match rule reads.
        return make_complete_shelters(
            _quantity=1,
            name=scenario["name"],
            status=StatusChoices.APPROVED,
            is_private=False,
        )[0]
