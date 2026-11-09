"""Tasks authority — grant-only CRUD, SHARED reads (ADR 0001 §5, RFC 0003 slice 1).

The tasks cutover follows the clients posture where RFC 0003 says so — reads
are SHARED (any ``tasks.view_task`` holder sees every task, from any org) — and
scopes writes to the acting org: create authorizes ``require_can(ADD)`` at the
payload org, update/delete authorize ``can_obj`` on the row.  These tests pin
the cutover posture:

* role-backed grants authorize with **no legacy group at all**;
* stale legacy-only holders are **denied** (the tasks legacy rows are inert),
  and the list gate answers empty-not-error for them;
* a holder's grant at another org still reads (SHARED read) but cannot write;
* a write needs the *exact* permission — ADD alone does not change or delete;
* the org travels in the payload and unknown/malformed orgs fail closed;
* a task created through a note passes the same gate — the nested replace-all
  is not a way around ``tasks.add``/``tasks.delete``;
* the global tier still passes.
"""

from typing import Tuple

from django.core.exceptions import PermissionDenied
from model_bakery import baker
from organizations.models import Organization

from accounts.models import User
from accounts.selectors import resolve_permission_group
from accounts.services import sync_roles
from clients.models import ClientProfile
from common.permissions.utils import PERMISSION_DENIED_MESSAGE
from common.tests.utils import GraphQLBaseTestCase, make_legacy_only_holder
from notes.groups import CASEWORKER
from notes.models import Note
from notes.services import note_update
from tasks.models import Task
from tasks.tests.utils import TaskGraphQLUtilsMixin

ORG_DENIED_MESSAGE = "You do not have access to this organization."


class TaskGrantAuthorityTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    """Grant holders manage tasks after the grant-only cutover."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.client_profile = baker.make(ClientProfile)
        self.task = baker.make(
            Task, organization=self.org_1, summary="existing task", client_profile=self.client_profile
        )

    def _grant(self, user: User, org: Organization, role_name: str, perms: Tuple[str, ...]) -> None:
        for perm in perms:
            self._grant_permission(user, perm, org, role_name=role_name)

    def test_role_backed_caseworker_has_full_task_crud(self) -> None:
        self.assertTrue(
            self.org_1_case_manager_1.grants.filter(scope_org=self.org_1, role__name=CASEWORKER.name).exists()
        )
        self.graphql_client.force_login(self.org_1_case_manager_1)

        created = self.create_task_fixture({"summary": "grant-era task"})
        self.assertIsNone(created.get("errors"))
        task_id = created["data"]["createTask"]["id"]

        read = self.task_query(task_id)
        self.assertIsNone(read.get("errors"))
        self.assertEqual(read["data"]["task"]["id"], task_id)

        updated = self.update_task_fixture({"id": task_id, "summary": "renamed"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateTask"]["summary"], "renamed")

        deleted = self.delete_task_fixture(task_id)
        self.assertNotIn("messages", deleted["data"]["deleteTask"])
        self.assertFalse(Task.objects.filter(pk=task_id).exists())

    def test_scoped_grant_holder_with_no_legacy_group_has_full_task_crud(self) -> None:
        """A scoped Grant alone authorizes — no legacy PermissionGroup needed."""
        editor = baker.make(User)
        self.org_1.add_user(editor)
        self._grant(
            editor,
            self.org_1,
            "Task Editor",
            (Task.perms.ADD, Task.perms.VIEW, Task.perms.CHANGE, Task.perms.DELETE),
        )
        self.graphql_client.force_login(editor)

        created = self.create_task_fixture({"summary": "grant-only task"})
        self.assertIsNone(created.get("errors"))
        task_id = created["data"]["createTask"]["id"]

        read = self.task_query(task_id)
        self.assertIsNone(read.get("errors"))

        updated = self.update_task_fixture({"id": task_id, "summary": "renamed"})
        self.assertIsNone(updated.get("errors"))

        deleted = self.delete_task_fixture(task_id)
        self.assertNotIn("messages", deleted["data"]["deleteTask"])
        self.assertFalse(Task.objects.filter(pk=task_id).exists())

    def test_superuser_manages_tasks_at_an_org(self) -> None:
        """The global tier is enforceable per org for the grant-only tasks domain."""
        user = baker.make(User, is_superuser=True)
        self.org_1.add_user(user)
        self.graphql_client.force_login(user)

        created = self.create_task_fixture({"summary": "superuser task"})
        self.assertIsNone(created.get("errors"))
        task_id = created["data"]["createTask"]["id"]

        updated = self.update_task_fixture({"id": task_id, "summary": "renamed by superuser"})
        self.assertIsNone(updated.get("errors"))
        self.assertEqual(updated["data"]["updateTask"]["summary"], "renamed by superuser")


class TaskGrantAuthorityDeniedTestCase(GraphQLBaseTestCase, TaskGraphQLUtilsMixin):
    """Authority absent: legacy-only holders, ADD-only holders, members, cross-org writes."""

    def setUp(self) -> None:
        super().setUp()
        sync_roles()
        self.client_profile = baker.make(ClientProfile)
        self.task = baker.make(
            Task, organization=self.org_1, summary="existing task", client_profile=self.client_profile
        )

    def _login(self, user: User) -> None:
        self.graphql_client.force_login(user)

    def _grant(self, user: User, org: Organization, role_name: str, perms: Tuple[str, ...]) -> None:
        for perm in perms:
            self._grant_permission(user, perm, org, role_name=role_name)

    def test_legacy_only_caseworker_is_denied_everywhere(self) -> None:
        """A legacy PermissionGroup CASEWORKER with no Grant holds no task authority.

        Reconcile converts caseworker rows to grants (ADR 0001 backfills); this
        simulates a stale leftover row — even if one exists it confers nothing,
        and the list read answers empty rather than erroring (parity shape).
        """
        legacy_holder = make_legacy_only_holder(
            user=baker.make(User), organization=self.org_1, template_name=CASEWORKER.name
        )
        self.assertFalse(legacy_holder.grants.filter(scope_org=self.org_1).exists())

        self._login(legacy_holder)

        initial_count = Task.objects.count()
        created = self.create_task_fixture({"summary": "should not appear"})
        self.assertGraphQLOperationInfo(created, "createTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

        # Single read refuses; the list answers empty-not-error.
        read = self.task_query(self.task.pk)
        self.assertIn("errors", read)

        listed = self.execute_graphql(self.get_tasks_query("id"))
        self.assertIsNone(listed.get("errors"))
        self.assertEqual(listed["data"]["tasks"]["totalCount"], 0)

        updated = self.update_task_fixture({"id": self.task.pk, "summary": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self.delete_task_fixture(self.task.pk)
        self.assertGraphQLOperationInfo(deleted, "deleteTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        refreshed = Task.objects.get(pk=self.task.pk)
        self.assertEqual(refreshed.summary, "existing task")

    def test_grantless_org_member_is_denied(self) -> None:
        member = baker.make(User)
        self.org_1.add_user(member)
        self._login(member)

        initial_count = Task.objects.count()
        created = self.create_task_fixture({"summary": "should not appear"})
        self.assertGraphQLOperationInfo(created, "createTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

        read = self.task_query(self.task.pk)
        self.assertIn("errors", read)

    def test_create_task_denial_does_not_reveal_whether_an_id_exists(self) -> None:
        """A real and a bogus parent id must refuse identically.

        The FKs were resolved before authorizing, so an unauthorized caller got
        ``DoesNotExist`` ("Note matching query does not exist.") for an unknown
        id and a PERMISSION refusal for a real one — an existence oracle.
        """
        self._login(self.non_case_manager_user)
        real_note = baker.make(Note, organization=self.org_2)

        for note_id in ("999999999", str(real_note.pk)):
            created = self.create_task_fixture({"summary": "probe", "note": note_id})
            self.assertGraphQLOperationInfo(created, "createTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

    def test_create_task_refuses_a_note_from_another_org(self) -> None:
        """The task's parents have to belong to the task's org.

        Reads are agency-wide, so attaching a foreign note would plant a task on
        another org's note.  Client profiles are platform-shared and HMIS notes
        carry no org — the note is the only parent with a tenant to check.
        """
        foreign_note = baker.make(Note, organization=self.org_2)
        self._login(self.org_1_case_manager_1)

        initial_count = Task.objects.count()
        created = self.create_task_fixture({"summary": "cross-org", "note": str(foreign_note.pk)})
        self.assertGraphQLOperationInfo(created, "createTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

    def test_create_task_allows_a_note_from_the_same_org(self) -> None:
        own_note = baker.make(Note, organization=self.org_1)
        self._login(self.org_1_case_manager_1)

        created = self.create_task_fixture({"summary": "same org", "note": str(own_note.pk)})
        self.assertIsNone(created.get("errors"))
        self.assertEqual(Task.objects.get(pk=created["data"]["createTask"]["id"]).note_id, own_note.pk)

    def test_grant_holder_with_only_add_cannot_update_or_delete(self) -> None:
        """Mutations thread the exact permission: CHANGE/DELETE, not just ADD."""
        add_only = baker.make(User)
        self.org_1.add_user(add_only)
        self._grant(add_only, self.org_1, "Task Creator", (Task.perms.ADD,))

        self._login(add_only)
        created = self.create_task_fixture({"summary": "created"})
        self.assertIsNone(created.get("errors"))

        updated = self.update_task_fixture({"id": self.task.pk, "summary": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self.delete_task_fixture(self.task.pk)
        self.assertGraphQLOperationInfo(deleted, "deleteTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

    def test_grant_at_org_a_cannot_create_at_org_b(self) -> None:
        """Create authorizes at the payload org — a grant elsewhere does not carry."""
        member = baker.make(User)
        self.org_1.add_user(member)
        self._grant(member, self.org_1, "Org 1 Task Creator", (Task.perms.ADD,))

        self._login(member)
        initial_count = Task.objects.count()
        created = self.create_task_fixture({"summary": "wrong org", "organizationId": self.org_2.pk})
        self.assertGraphQLOperationInfo(created, "createTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

    def test_org_2_grant_reads_org_1_tasks_but_cannot_modify_them(self) -> None:
        """SHARED read reaches rows at any org; writes stay scoped to the row's org."""
        holder = baker.make(User)
        self.org_2.add_user(holder)
        self._grant(
            holder,
            self.org_2,
            "Org 2 Task Editor",
            (Task.perms.VIEW, Task.perms.CHANGE, Task.perms.DELETE),
        )

        self._login(holder)
        read = self.task_query(self.task.pk)
        self.assertIsNone(read.get("errors"))
        self.assertEqual(read["data"]["task"]["id"], str(self.task.pk))

        listed = self.execute_graphql(self.get_tasks_query("id"))
        self.assertIsNone(listed.get("errors"))
        self.assertEqual(listed["data"]["tasks"]["totalCount"], 1)

        updated = self.update_task_fixture({"id": self.task.pk, "summary": "nope"})
        self.assertGraphQLOperationInfo(updated, "updateTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        deleted = self.delete_task_fixture(self.task.pk)
        self.assertGraphQLOperationInfo(deleted, "deleteTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")

        refreshed = Task.objects.get(pk=self.task.pk)
        self.assertEqual(refreshed.summary, "existing task")

    def test_create_task_with_an_unknown_organization_is_denied(self) -> None:
        """``org_or_deny`` on the payload org fails closed — unknown is not found."""
        self._login(self.org_1_case_manager_1)
        initial_count = Task.objects.count()

        created = self.create_task_fixture({"summary": "should not appear", "organizationId": 999999})
        self.assertGraphQLOperationInfo(created, "createTask", ORG_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

    def test_create_task_with_a_malformed_organization_is_denied(self) -> None:
        """A payload org the column cannot hold denies like an unknown one.

        Regression: a non-numeric or blank id used to reach Django as an
        unhandled ``ValueError`` — a 500-class error, not a refusal.
        """
        self._login(self.org_1_case_manager_1)
        initial_count = Task.objects.count()

        for bad_id in ("not-an-id", ""):
            with self.subTest(organizationId=bad_id):
                created = self.create_task_fixture({"summary": "should not appear", "organizationId": bad_id})
                self.assertGraphQLOperationInfo(created, "createTask", ORG_DENIED_MESSAGE, kind="PERMISSION")
        self.assertEqual(Task.objects.count(), initial_count)

    def test_missing_and_foreign_tasks_read_the_same_refusal(self) -> None:
        """The refusal must not say whether a task id exists.

        A missing task and a task in an org the caller has no authority at both
        answer with the standard PERMISSION message, so update/delete are not
        an existence oracle.
        """
        foreign_task = baker.make(Task, organization=self.org_2, summary="foreign")
        self._login(self.org_1_case_manager_1)

        missing_update = self.update_task_fixture({"id": 999999, "summary": "nope"})
        foreign_update = self.update_task_fixture({"id": foreign_task.pk, "summary": "nope"})
        missing_delete = self.delete_task_fixture(999999)
        foreign_delete = self.delete_task_fixture(foreign_task.pk)

        self.assertGraphQLOperationInfo(missing_update, "updateTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertGraphQLOperationInfo(foreign_update, "updateTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertGraphQLOperationInfo(missing_delete, "deleteTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")
        self.assertGraphQLOperationInfo(foreign_delete, "deleteTask", PERMISSION_DENIED_MESSAGE, kind="PERMISSION")


class NestedNoteTaskAuthorityTestCase(GraphQLBaseTestCase):
    """A task created through a note passes the same gate as ``createTask``.

    The note's nested task list is replace-all — a delete followed by a create —
    so both halves need authority.  The note's own gate is not a substitute for
    ``tasks.add``/``tasks.delete`` (RFC 0003).
    """

    def setUp(self) -> None:
        super().setUp()
        sync_roles()

    def test_note_update_refuses_nested_task_create_without_the_grant(self) -> None:
        note = baker.make(Note, organization=self.org_1)
        # Seed a row so the replace-all delete half is exercised, not just create.
        existing = baker.make(Task, organization=self.org_1, summary="already on the note")
        note.tasks.add(existing)
        # A leftover legacy group member: can reach the note, holds no Grant.
        stranger = make_legacy_only_holder(organization=self.org_1, template_name="Caseworker", user=baker.make(User))
        permission_group = resolve_permission_group(stranger, template=CASEWORKER)

        with self.assertRaises(PermissionDenied):
            note_update(
                note=note,
                data={"tasks": [{"summary": "smuggled through the note"}]},
                user=stranger,
                permission_group=permission_group,
            )

        # The refused replace-all rolled back: the seeded task survives.
        self.assertTrue(note.tasks.filter(pk=existing.pk).exists())
        self.assertEqual(note.tasks.count(), 1)

    def test_note_update_requires_delete_to_replace_existing_tasks(self) -> None:
        """Replace-all is a delete: ``tasks.add`` alone must not wipe the list."""
        note = baker.make(Note, organization=self.org_1)
        existing = baker.make(Task, organization=self.org_1, summary="already on the note")
        note.tasks.add(existing)

        add_only = baker.make(User)
        self.org_1.add_user(add_only)
        self._grant_permission(add_only, Task.perms.ADD, self.org_1, role_name="Note Task Adder")
        permission_group = resolve_permission_group(self.org_1_case_manager_1, template=CASEWORKER)

        with self.assertRaises(PermissionDenied):
            note_update(
                note=note,
                data={"tasks": [{"summary": "replacement"}]},
                user=add_only,
                permission_group=permission_group,
            )

        self.assertTrue(note.tasks.filter(pk=existing.pk).exists())

    def test_note_update_still_creates_nested_tasks_for_a_grant_holder(self) -> None:
        note = baker.make(Note, organization=self.org_1)
        holder = self.org_1_case_manager_1
        permission_group = resolve_permission_group(holder, template=CASEWORKER)

        note_update(
            note=note,
            data={"tasks": [{"summary": "legitimate task"}]},
            user=holder,
            permission_group=permission_group,
        )

        self.assertEqual(note.tasks.get().summary, "legitimate task")
