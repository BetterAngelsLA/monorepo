"""Notes authority — grant-only CRUD, SHARED reads (ADR 0001 §5, RFC 0003 slice 2).

The notes cutover follows the RFC 0003 posture: reads are SHARED (any
``notes.view_note`` holder sees every note, from any org), writes are scoped to
the acting org — create authorizes ``require_can(ADD)`` at the payload org,
update/delete/revert fetch through ``writable`` on the row, and a
service-request delete is gated by the org of its owning note.  These tests pin
the cutover posture:

* role-backed grants authorize with **no legacy group at all**;
* stale legacy-only holders are **denied** (the notes legacy rows are inert),
  and the list gate answers empty-not-error for them;
* a holder's grant at another org still reads (SHARED read) but cannot write;
* a write needs the *exact* permission — ADD alone does not change or delete;
* the org travels in the payload and unknown/malformed orgs fail closed;
* a detached service request fails closed on delete;
* the compat window keeps pre-payload builds creating via the legacy group;
* the global tier still passes.
"""

from typing import Any, Dict, Tuple

from accounts.models import User
from accounts.services import sync_roles
from common.permissions.utils import PERMISSION_DENIED_MESSAGE
from common.tests.utils import make_legacy_only_holder
from model_bakery import baker
from notes.groups import CASEWORKER
from notes.models import Note, ServiceRequest
from notes.tests.utils import NoteGraphQLBaseTestCase
from organizations.models import Organization

ORG_DENIED_MESSAGE = "You do not have access to this organization."
DELETE_NOTE_DENIED_MESSAGE = "You do not have permission to delete this interaction."
DELETE_SR_DENIED_MESSAGE = "You do not have permission to delete this service request."


class _NoteGrantHelpers:
    """Grant + payload builders shared by the authority test cases."""

    def _grant(self, user: User, org: Organization, role_name: str, perms: Tuple[str, ...]) -> None:
        for perm in perms:
            self._grant_permission(user, perm, org, role_name=role_name)

    def _create_payload(self, **overrides: Any) -> Dict[str, Any]:
        variables: Dict[str, Any] = {
            "purpose": "grant-era note",
            "publicDetails": "grant-era details",
            "clientProfile": str(self.client_profile_1.pk),
            "organizationId": str(self.org_1.pk),
        }
        variables.update(overrides)
        return variables


class NoteGrantAuthorityTestCase(_NoteGrantHelpers, NoteGraphQLBaseTestCase):
    """Grant holders manage notes after the grant-only cutover."""

    def setUp(self) -> None:
        super().setUp()
        # Provision the code-owned Role rows so OrgRoleManager mirrors Grants
        # for role-backed memberships (CASEWORKER_ROLE carries the note bundle
        # added by the cutover).
        sync_roles()

    def test_role_backed_caseworker_has_full_note_crud(self) -> None:
        # Sanity: the mirrored Grant is what authorizes — nothing else.
        self.assertTrue(
            self.org_1_case_manager_1.grants.filter(scope_org=self.org_1, role__name=CASEWORKER.name).exists()
        )
        self.graphql_client.force_login(self.org_1_case_manager_1)

        created = self._create_note_fixture(self._create_payload())
        self.assertIsNone(created.get("errors"))
        note_id = created["data"]["createNote"]["id"]

        updated = self._update_note_fixture({"id": note_id, "purpose": "renamed"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateNote"]["purpose"], "renamed")

        deleted = self._delete_note_fixture(note_id)
        self.assertNotIn("messages", deleted["data"]["deleteNote"])
        self.assertFalse(Note.objects.filter(pk=note_id).exists())

    def test_scoped_grant_holder_with_no_legacy_group_has_full_note_crud(self) -> None:
        """A scoped Grant alone authorizes — no legacy PermissionGroup needed."""
        editor = baker.make(User)
        self.org_1.add_user(editor)
        self._grant(
            editor,
            self.org_1,
            "Note Editor",
            (Note.perms.ADD, Note.perms.VIEW, Note.perms.CHANGE, Note.perms.DELETE),
        )
        self.graphql_client.force_login(editor)

        created = self._create_note_fixture(self._create_payload())
        self.assertIsNone(created.get("errors"))
        note_id = created["data"]["createNote"]["id"]

        updated = self._update_note_fixture({"id": note_id, "purpose": "renamed"})
        self.assertIsNone(updated.get("errors"))

        deleted = self._delete_note_fixture(note_id)
        self.assertNotIn("messages", deleted["data"]["deleteNote"])
        self.assertFalse(Note.objects.filter(pk=note_id).exists())

    def test_superuser_manages_notes_at_an_org(self) -> None:
        """The global tier is enforceable per org for the grant-only notes domain."""
        user = baker.make(User, is_superuser=True)
        self.org_1.add_user(user)
        self.graphql_client.force_login(user)

        created = self._create_note_fixture(self._create_payload())
        self.assertIsNone(created.get("errors"))
        note_id = created["data"]["createNote"]["id"]

        updated = self._update_note_fixture({"id": note_id, "purpose": "renamed by superuser"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateNote"]["purpose"], "renamed by superuser")


class NoteGrantAuthorityDeniedTestCase(_NoteGrantHelpers, NoteGraphQLBaseTestCase):
    """Authority absent: legacy-only holders, ADD-only holders, members, cross-org writes."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_legacy_only_caseworker_is_denied_everywhere(self) -> None:
        """A legacy PermissionGroup CASEWORKER with no Grant holds no note authority.

        Reconcile converts caseworker rows to grants (ADR 0001 backfills); this
        simulates a stale leftover row — even if one exists it confers nothing,
        and the list read answers empty rather than erroring (parity shape).
        """
        legacy_holder = make_legacy_only_holder(
            user=baker.make(User), organization=self.org_1, template_name=CASEWORKER.name
        )
        self.assertFalse(legacy_holder.grants.filter(scope_org=self.org_1).exists())

        self.graphql_client.force_login(legacy_holder)

        initial_count = Note.objects.count()
        created = self._create_note_fixture(self._create_payload())
        self.assertGraphQLOperationInfo(created, "createNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Note.objects.count(), initial_count)

        # Single read refuses; the list answers empty-not-error.
        read = self.execute_graphql("query ($id: ID!) { note(pk: $id) { id } }", {"id": self.note["id"]})
        self.assertIn("errors", read)

        listed = self.execute_graphql("query { notes { totalCount } }")
        self.assertIsNone(listed.get("errors"))
        self.assertEqual(listed["data"]["notes"]["totalCount"], 0)

        updated = self._update_note_fixture({"id": self.note["id"], "purpose": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self._delete_note_fixture(self.note["id"])
        self.assertGraphQLOperationInfo(
            deleted, "deleteNote", DELETE_NOTE_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )

        refreshed = Note.objects.get(pk=self.note["id"])
        self.assertEqual(refreshed.purpose, self.note["purpose"])

    def test_grantless_org_member_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)
        self.graphql_client.force_login(member)

        initial_count = Note.objects.count()
        created = self._create_note_fixture(self._create_payload())
        self.assertGraphQLOperationInfo(created, "createNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Note.objects.count(), initial_count)

        read = self.execute_graphql("query ($id: ID!) { note(pk: $id) { id } }", {"id": self.note["id"]})
        self.assertIn("errors", read)

    def test_grant_holder_with_only_add_cannot_update_or_delete(self) -> None:
        """Mutations thread the exact permission: CHANGE/DELETE, not just ADD."""
        add_only = baker.make(User)
        self.org_1.add_user(add_only)
        self._grant(add_only, self.org_1, "Note Creator", (Note.perms.ADD,))

        self.graphql_client.force_login(add_only)
        created = self._create_note_fixture(self._create_payload())
        self.assertIsNone(created.get("errors"))

        updated = self._update_note_fixture({"id": self.note["id"], "purpose": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self._delete_note_fixture(self.note["id"])
        self.assertGraphQLOperationInfo(
            deleted, "deleteNote", DELETE_NOTE_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )

    def test_grant_at_org_2_reads_org_1_notes_but_cannot_modify_them(self) -> None:
        """SHARED read reaches rows at any org; writes stay scoped to the row's org."""
        holder = baker.make(User)
        self.org_2.add_user(holder)
        self._grant(
            holder,
            self.org_2,
            "Org 2 Note Editor",
            (Note.perms.VIEW, Note.perms.CHANGE, Note.perms.DELETE),
        )

        self.graphql_client.force_login(holder)
        read = self.execute_graphql("query ($id: ID!) { note(pk: $id) { id } }", {"id": self.note["id"]})
        self.assertIsNone(read.get("errors"))
        self.assertEqual(read["data"]["note"]["id"], str(self.note["id"]))

        listed = self.execute_graphql("query { notes { totalCount } }")
        self.assertIsNone(listed.get("errors"))
        self.assertEqual(listed["data"]["notes"]["totalCount"], 1)

        updated = self._update_note_fixture({"id": self.note["id"], "purpose": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self._delete_note_fixture(self.note["id"])
        self.assertGraphQLOperationInfo(
            deleted, "deleteNote", DELETE_NOTE_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )

        refreshed = Note.objects.get(pk=self.note["id"])
        self.assertEqual(refreshed.purpose, self.note["purpose"])

    def test_uploads_require_change_at_the_notes_org(self) -> None:
        """The upload gates need CHANGE on the note — attachments ride the note gate."""
        holder = baker.make(User)
        self.org_2.add_user(holder)
        self._grant(holder, self.org_2, "Org 2 Note Viewer", (Note.perms.VIEW,))

        self.graphql_client.force_login(holder)
        response = self.execute_graphql(
            """
            mutation Generate($data: GenerateNoteAttachmentUploadsInput!) {
                generateNoteFileUploads(data: $data) {
                    ... on OperationInfo {
                        messages {
                            kind
                            message
                        }
                    }
                }
            }
            """,
            {
                "data": {
                    "noteId": self.note["id"],
                    "uploads": [{"refId": "ref-1", "filename": "doc.pdf", "contentType": "application/pdf"}],
                }
            },
        )

        self.assertGraphQLOperationInfo(
            response, "generateNoteFileUploads", PERMISSION_DENIED_MESSAGE, kind="PERMISSION"
        )

    def test_create_note_with_an_unknown_organization_is_denied(self) -> None:
        """``resolve_org_or_deny`` on the payload org fails closed — unknown is not found."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        initial_count = Note.objects.count()

        created = self._create_note_fixture(self._create_payload(organizationId=999999))
        self.assertGraphQLOperationInfo(created, "createNote", ORG_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Note.objects.count(), initial_count)

    def test_create_note_with_a_malformed_organization_is_denied(self) -> None:
        """A payload org the column cannot hold denies like an unknown one.

        Regression: a non-numeric or blank id used to reach Django as an
        unhandled ``ValueError`` — a 500-class error, not a refusal.
        """
        self.graphql_client.force_login(self.org_1_case_manager_1)
        initial_count = Note.objects.count()

        for bad_id in ("not-an-id", ""):
            with self.subTest(organizationId=bad_id):
                created = self._create_note_fixture(self._create_payload(organizationId=bad_id))
                self.assertGraphQLOperationInfo(created, "createNote", ORG_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Note.objects.count(), initial_count)

    def test_service_request_delete_is_gated_by_the_owning_note(self) -> None:
        """The SR delete is authorized at the org of the note carrying the request."""
        self.graphql_client.force_login(self.org_1_case_manager_1)
        created = self._create_note_service_request_fixture(
            {
                "noteId": self.note["id"],
                "serviceOther": "Retrieved Other Service",
                "serviceRequestType": "REQUESTED",
            }
        )
        self.assertIsNone(created.get("errors"))
        sr_id = created["data"]["createNoteServiceRequest"]["id"]

        holder = baker.make(User)
        self.org_2.add_user(holder)
        self._grant(holder, self.org_2, "Org 2 Note Editor", (Note.perms.CHANGE,))
        self.graphql_client.force_login(holder)

        denied = self._delete_service_request_fixture(sr_id)
        self.assertGraphQLOperationInfo(
            denied, "deleteServiceRequest", DELETE_SR_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )
        self.assertTrue(ServiceRequest.objects.filter(pk=sr_id).exists())

        self.graphql_client.force_login(self.org_1_case_manager_1)
        deleted = self._delete_service_request_fixture(sr_id)
        self.assertNotIn("messages", deleted["data"]["deleteServiceRequest"])
        self.assertFalse(ServiceRequest.objects.filter(pk=sr_id).exists())

    def test_detached_service_request_delete_fails_closed(self) -> None:
        """A service request attached to no note has no authorizing org — delete denies."""
        orphan_sr = baker.make(ServiceRequest, service=None)
        self.graphql_client.force_login(self.org_1_case_manager_1)

        denied = self._delete_service_request_fixture(orphan_sr.pk)
        self.assertGraphQLOperationInfo(
            denied, "deleteServiceRequest", DELETE_SR_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )
        self.assertTrue(ServiceRequest.objects.filter(pk=orphan_sr.pk).exists())

    def test_missing_and_foreign_notes_read_the_same_refusal(self) -> None:
        """The refusal must not say whether a note id exists.

        A missing note and a note in an org the caller has no authority at both
        answer with the standard PERMISSION message, so update/delete are not
        an existence oracle.
        """
        foreign_note = baker.make(Note, organization=self.org_2, purpose="foreign")
        self.graphql_client.force_login(self.org_1_case_manager_1)

        missing_update = self._update_note_fixture({"id": 999999, "purpose": "nope"})
        foreign_update = self._update_note_fixture({"id": foreign_note.pk, "purpose": "nope"})
        missing_delete = self._delete_note_fixture(999999)
        foreign_delete = self._delete_note_fixture(foreign_note.pk)

        self.assertGraphQLOperationInfo(missing_update, "updateNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertGraphQLOperationInfo(foreign_update, "updateNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertGraphQLOperationInfo(
            missing_delete, "deleteNote", DELETE_NOTE_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )
        self.assertGraphQLOperationInfo(
            foreign_delete, "deleteNote", DELETE_NOTE_DENIED_MESSAGE, kind="PERMISSION", exact=True
        )


class NoteCreateCompatWindowTestCase(_NoteGrantHelpers, NoteGraphQLBaseTestCase):
    """Builds that predate the payload organization still create via the legacy group.

    The compat window keeps released binaries working while the app build
    sending ``organizationId`` ships; the strict flip removes both the fallback
    and these tests.
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_pre_payload_build_creates_via_the_legacy_caseworker_group(self) -> None:
        self.graphql_client.force_login(self.org_1_case_manager_1)

        response = self._create_note_fixture({"purpose": "legacy client note"})
        self.assertIsNone(response.get("errors"))

        note = Note.objects.get(pk=response["data"]["createNote"]["id"])
        self.assertEqual(note.organization_id, self.org_1.pk)

    def test_pre_payload_build_without_a_caseworker_group_is_refused(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)
        self.graphql_client.force_login(member)

        note_count = Note.objects.count()
        response = self._create_note_fixture({"purpose": "should not appear"})
        self.assertGraphQLOperationInfo(response, "createNote", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Note.objects.count(), note_count)
