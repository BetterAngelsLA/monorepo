"""Regression tests for the audit-log review findings.

Each test pins a behavior that the review flagged as broken: ``ContactInfo``
leaking through the log, retention corrupting a surviving diff, retention
deleting other apps' history, and ``OFFSET`` pagination repeating an action when
a write lands between pages. They failed on the reviewed head and now stay in
the suite as regressions. The index/``EXPLAIN`` probes live in
``test_audit_indexes.py``.

Run with the shared test database:

    python -m pytest audit/tests/test_audit_regressions.py -q --reuse-db
"""

import datetime
import json

from django.core.management import call_command
from django.test import TestCase
from model_bakery import baker

from accounts.models import Role, User
from accounts.services import role_assign, sync_roles
from audit.selectors import object_audit_log
from audit.tests.utils import audit_context
from clients.admin import ClientProfileResource
from clients.enums import LivingSituationEnum
from clients.models import ClientProfile
from common.tests.utils import GraphQLBaseTestCase
from shelters.groups import GLOBAL_SHELTER_OPERATOR_ROLE
from shelters.models import ContactInfo, Shelter
from test_utils.pghistory import backdate_event_rows

_OLD = datetime.datetime(2020, 1, 1, tzinfo=datetime.timezone.utc)

AUDIT_QUERY = """
    query($targetType: AuditTargetType!, $objectId: ID!) {
        objectAuditLog(targetType: $targetType, objectId: $objectId, includeSnapshot: true) {
            results {
                fieldChanges
                events {
                    fieldChanges
                    snapshot
                }
            }
        }
    }
"""


class ContactInfoExclusionRegression(GraphQLBaseTestCase):
    """ContactInfo is internal BA data: no caller may read it through the log.

    The rows are still written (tracking is unchanged); the selector excludes the
    event model for every target and every caller, so contact names, emails, and
    phone numbers cannot surface even with ``includeSnapshot``.
    """

    def setUp(self) -> None:
        super().setUp()
        self._grant_permission(self.org_1_case_manager_1, Shelter.perms.VIEW, self.org_1)
        with audit_context(label="seed"):
            self.shelter = Shelter.objects.create(name="Repro Shelter", organization=self.org_1)
        with audit_context(user=self.org_1_case_manager_2):
            self.contact = ContactInfo.objects.create(
                shelter=self.shelter,
                contact_name="BA Secret",
                contact_number="+15551234567",
                contact_email="secret@example.com",
                is_claimant=True,
            )
        # A non-contact action so the log cannot be empty for the wrong reason.
        with audit_context(user=self.org_1_case_manager_2):
            self.shelter.name = "Repro Shelter Renamed"
            self.shelter.save()

    def _assert_no_contact_data(self, payload: dict) -> None:
        dumped = json.dumps(payload)
        self.assertNotIn("Contact info", dumped)
        self.assertNotIn("BA Secret", dumped)
        self.assertNotIn("secret@example.com", dumped)
        self.assertNotIn("+15551234567", dumped)
        # The unrelated shelter action still renders, so the exclusion is
        # specific rather than a silently empty log.
        self.assertIn("Repro Shelter Renamed", dumped)

    def test_contact_rows_exist_but_are_never_rendered_for_a_scoped_operator(self) -> None:
        ContactInfoEvent = ContactInfo.pgh_event_model  # type: ignore[attr-defined]
        self.assertTrue(ContactInfoEvent.objects.filter(pgh_obj_id=self.contact.pk).exists())

        self.graphql_client.force_login(self.org_1_case_manager_1)
        response = self.execute_graphql(
            AUDIT_QUERY,
            variables={"targetType": "SHELTER", "objectId": str(self.shelter.id)},
        )

        self.assertIsNone(response.get("errors"))
        self._assert_no_contact_data(response)

    def test_contact_rows_are_hidden_from_the_global_operator_too(self) -> None:
        sync_roles()
        global_operator = baker.make(User)
        role_assign(user=global_operator, role=Role.objects.get(name=GLOBAL_SHELTER_OPERATOR_ROLE.name))

        self.graphql_client.force_login(global_operator)
        response = self.execute_graphql(
            AUDIT_QUERY,
            variables={"targetType": "SHELTER", "objectId": str(self.shelter.id)},
        )

        self.assertIsNone(response.get("errors"))
        self._assert_no_contact_data(response)


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

        actions = object_audit_log(obj=shelter, target_type="SHELTER").results

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


class CursorPaginationRegression(TestCase):
    """A cursor page must not repeat an action when a new event arrives."""

    def test_cursor_pagination_does_not_duplicate_across_pages(self) -> None:
        with audit_context(label="seed"):
            shelter = Shelter.objects.create(name="Page Shelter")
        for name in ("A", "B", "C", "D"):
            with audit_context():
                shelter.name = name
                shelter.save()

        page1 = object_audit_log(obj=shelter, target_type="SHELTER", limit=2)

        # A new action arrives between page requests. Offset pagination would
        # shift the window and repeat ``C``; the cursor is anchored to the last
        # action of page 1, so it continues strictly after it.
        with audit_context():
            shelter.name = "E"
            shelter.save()

        page2 = object_audit_log(obj=shelter, target_type="SHELTER", limit=2, after=page1.end_cursor)
        names1 = {action.field_changes["name"][1] for action in page1.results}
        names2 = {action.field_changes["name"][1] for action in page2.results}

        self.assertFalse(names1 & names2, f"duplicate across pages: {names1 & names2}")
        # Page 2 continues from where page 1 stopped (B, A), not from the top.
        self.assertEqual(names2, {"A", "B"})
