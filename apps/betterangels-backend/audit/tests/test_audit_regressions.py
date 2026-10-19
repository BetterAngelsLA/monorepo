"""Regression tests for the audit-log findings.

These are deterministic behavior checks for the four blockers discussed on the PR.
They fail on the current head by design; once a fix lands they should pass (and then
stay in the suite as regressions). The performance/EXPLAIN probes are deliberately
not included because plan choice and timings vary with statistics and data volume.

Run with an isolated test database:

    POSTGRES_TEST_NAME=test_audit_regressions python -m pytest \
        audit/tests/test_audit_regressions.py -q
"""

import datetime
import json

from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker

from audit.selectors import object_audit_log
from audit.tests.utils import audit_context
from clients.admin import ClientProfileResource
from clients.enums import LivingSituationEnum
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from shelters.models import ContactInfo, Shelter
from test_utils.pghistory import backdate_event_rows

_OLD = datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)

AUDIT_QUERY = """
    query($targetType: AuditTargetType!, $objectId: ID!) {
        objectAuditLog(targetType: $targetType, objectId: $objectId, includeSnapshot: true) {
            fieldChanges
            events {
                fieldChanges
                snapshot
            }
        }
    }
"""


class ContactInfoAuthorizationRegression(GraphQLBaseTestCase):
    """A scoped Shelter.VIEW holder must not read BA-only ContactInfo rows."""

    def setUp(self) -> None:
        super().setUp()
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Repro Shelter", organization=self.org_1)
        with audit_context(user=self.org_1_case_manager_2):
            ContactInfo.objects.create(
                shelter=self.shelter,
                contact_name="BA Secret",
                contact_number="+15551234567",
                contact_email="secret@example.com",
                is_claimant=True,
            )

    def test_scoped_operator_cannot_read_contact_info(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)
        response = self.execute_graphql(
            AUDIT_QUERY,
            variables={"targetType": "SHELTER", "objectId": str(self.shelter.id)},
        )
        payload = json.dumps(response)

        # Current head: both assertions fail because returns Contact info rows.
        self.assertNotIn("Contact info", payload)
        self.assertNotIn("secret@example.com", payload)


class PurgeDiffRegression(TestCase):
    """A purge must not rewrite the first surviving event's old -> new pair."""

    def test_purge_preserves_the_first_surviving_diff(self) -> None:
        with audit_context(label="seed"):
            shelter = Shelter.objects.create(name="Original")
        with audit_context():
            shelter.name = "Intermediate"
            shelter.save()
        with audit_context():
            shelter.name = "Final"
            shelter.save()

        ShelterEvent = Shelter.pgh_event_model  # type: ignore[attr-defined]
        events = list(ShelterEvent.objects.filter(pgh_obj_id=shelter.pk).order_by("pgh_id"))
        # Age the INSERT and the first update. The first update is the latest
        # pre-cutoff row and should be retained as the boundary row.
        for event in events[:2]:
            backdate_event_rows(
                ShelterEvent.objects.filter(pk=event.pk),
                pgh_created_at=_OLD,
            )

        call_command("purge_audit_log", before="2021-01-01")

        actions = object_audit_log(obj=shelter, target_type="SHELTER")

        # Current head: {} because the previous row was deleted and pgh_diff is
        # computed at read time from the surviving previous event.
        self.assertEqual(actions[0].field_changes.get("name"), ["Intermediate", "Final"])


class PurgeClientExportRegression(TestCase):
    """A purge must not change the client export's "initial living situation"."""

    def test_purge_preserves_initial_living_situation(self) -> None:
        profile = baker.make(ClientProfile, living_situation=LivingSituationEnum.TENT)
        profile.living_situation = LivingSituationEnum.HOUSING
        profile.save()

        resource = ClientProfileResource()
        self.assertEqual(resource.dehydrate_living_situation_initial(profile), "Tent")

        ClientProfileEvent = ClientProfile.pgh_event_model  # type: ignore[attr-defined]
        first = ClientProfileEvent.objects.filter(pgh_obj_id=profile.pk).order_by("pgh_id").first()
        ClientProfileEvent.objects.filter(pk=first.pk).update(pgh_created_at=_OLD)

        call_command("purge_audit_log", before="2021-01-01")

        # Current head: "Housing" because the earliest living-situation event was deleted.
        self.assertEqual(resource.dehydrate_living_situation_initial(profile), "Tent")


class OffsetPaginationRegression(TestCase):
    """Offset pagination must not repeat an action when a new event arrives."""

    def test_offset_pagination_does_not_duplicate_across_pages(self) -> None:
        with audit_context(label="seed"):
            shelter = Shelter.objects.create(name="Page Shelter")
        for name in ("A", "B", "C", "D"):
            with audit_context():
                shelter.name = name
                shelter.save()

        page1 = object_audit_log(obj=shelter, target_type="SHELTER", limit=2, offset=0)

        # A new action arrives between page requests.
        with audit_context():
            shelter.name = "E"
            shelter.save()

        page2 = object_audit_log(obj=shelter, target_type="SHELTER", limit=2, offset=2)
        names1 = {action.field_changes["name"][1] for action in page1}
        names2 = {action.field_changes["name"][1] for action in page2}

        # Current head: page 1 (before the insert) is [D, C]; page 2 (after the
        # insert, offset 2) is [C, B], so C repeats.
        self.assertFalse(names1 & names2, f"duplicate across pages: {names1 & names2}")
