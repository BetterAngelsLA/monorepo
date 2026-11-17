"""``audit_shelter_availability`` — the pre-flight check for the capacity rule.

The rule only governs writes, so a shelter that predates it can be stranded
above its capacity: every save that touches availability then fails. This
command is how that set is found before the rule ships.
"""

from io import StringIO

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from shelters.models import Shelter, ShelterAvailability


class AuditShelterAvailabilityTestCase(TestCase):
    def _stranded(self, *, total_beds: int, non_restricted: int, restricted: int = 0) -> Shelter:
        shelter = Shelter.objects.create(name=f"Stranded {non_restricted}/{total_beds}", total_beds=total_beds)
        ShelterAvailability.objects.filter(shelter=shelter).update(
            non_restricted_beds=non_restricted,
            restricted_beds=restricted,
        )
        return shelter

    def _run(self, *args: str) -> str:
        out = StringIO()
        call_command("audit_shelter_availability", *args, stdout=out)
        return out.getvalue()

    def test_reports_only_shelters_over_capacity(self) -> None:
        stranded = self._stranded(total_beds=4, non_restricted=6)
        healthy = Shelter.objects.create(name="Healthy Shelter", total_beds=10)

        output = self._run()

        self.assertIn(f"shelter {stranded.pk}:", output)
        self.assertIn("exceeds total beds 4 by 2", output)
        self.assertNotIn(f"shelter {healthy.pk}:", output)

    def test_reports_both_counters_in_the_detail(self) -> None:
        self._stranded(total_beds=3, non_restricted=2, restricted=4)

        output = self._run()

        self.assertIn("available 6 (2 unrestricted + 4 restricted)", output)

    def test_quiet_when_every_shelter_fits(self) -> None:
        Shelter.objects.create(name="Healthy Shelter", total_beds=10)

        output = self._run()

        self.assertIn("No shelter availability exceeds its capacity.", output)

    def test_unknown_capacity_is_not_a_violation(self) -> None:
        shelter = Shelter.objects.create(name="Unknown Capacity", total_beds=None)
        ShelterAvailability.objects.filter(shelter=shelter).update(non_restricted_beds=50)

        output = self._run()

        self.assertIn("No shelter availability exceeds its capacity.", output)

    def test_fail_flag_raises_so_the_deploy_can_stop(self) -> None:
        self._stranded(total_beds=4, non_restricted=6)

        with self.assertRaises(CommandError):
            self._run("--fail")

    def test_fail_flag_is_quiet_when_nothing_violates(self) -> None:
        Shelter.objects.create(name="Healthy Shelter", total_beds=10)

        self.assertIn("No shelter availability exceeds its capacity.", self._run("--fail"))
