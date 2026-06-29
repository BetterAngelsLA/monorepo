"""
Tests for the client merge service (preview, execute, undo).
"""

import secrets
from typing import Any, cast

from accounts.tests.baker_recipes import organization_recipe
from clients.enums import HmisAgencyEnum
from common.enums import AttachmentType
from clients.models import ClientContact, ClientHouseholdMember, ClientProfile, HmisProfile, SocialMediaProfile
from clients.services.merge import (
    MergeValidationError,
    execute_merge,
    preview_merge,
    undo_merge,
)
from common.models import Attachment, PhoneNumber
from django.contrib.contenttypes.models import ContentType
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from model_bakery import baker
from notes.models import Note, ServiceRequest
from organizations.models import Organization
from teams.models import Team


class MergeServiceTestCase(TestCase):
    """Base class that creates shared org/team/user for Notes."""

    _org: Organization | None = None
    _team: Team | None = None
    _user: Any = None

    @classmethod
    def setUpTestData(cls) -> None:
        cls._org = organization_recipe.make()
        cls._team = baker.make(Team, organization=cls._org)
        cls._user = baker.make("accounts.User")

    def _make_client(self, **kwargs: Any) -> ClientProfile:
        """Create a ClientProfile with all related objects including Notes.

        baker.make() auto-generates unique values for unique fields (email, california_id).
        Only pass explicit values when testing specific field behaviors.
        """
        client = cast(ClientProfile, baker.make(ClientProfile, **kwargs))

        # FK relations
        baker.make(HmisProfile, client_profile=client, hmis_id=f"HMIS-{client.pk}", agency=HmisAgencyEnum.LAHSA)
        baker.make(SocialMediaProfile, client_profile=client)
        baker.make(ClientContact, client_profile=client, name=f"Contact-{client.pk}")
        baker.make(ClientHouseholdMember, client_profile=client, name=f"HH-{client.pk}")

        # Notes and ServiceRequests (use shared org/team/user)
        baker.make(
            Note,
            client_profile=client,
            organization=self._org,
            team=self._team,
            created_by=self._user,
            _quantity=2,
        )
        baker.make(ServiceRequest, client_profile=client)

        # GFK relations
        ct = ContentType.objects.get_for_model(ClientProfile)
        fake_file = SimpleUploadedFile(name="test.pdf", content=b"test", content_type="application/pdf")
        for _ in range(2):
            Attachment.objects.create(
                file=fake_file,
                content_type=ct,
                object_id=client.pk,
                mime_type="application/pdf",
                attachment_type=AttachmentType.DOCUMENT,
            )
        PhoneNumber.objects.create(
            number=f"+1212555{client.pk:04d}"[:16],
            content_type=ct,
            object_id=client.pk,
        )

        return client


# ---------------------------------------------------------------------------
# preview_merge tests
# ---------------------------------------------------------------------------


class PreviewMergeTest(MergeServiceTestCase):
    def test_preview_two_clean_sources(self) -> None:
        # Null out unique fields to avoid false conflicts in preview
        a = self._make_client(first_name="Alice", last_name="Doe", email=None)
        b = self._make_client(first_name="Alise", last_name="Doe", email=None)
        t = self._make_client(first_name="A", last_name="Doe", email=None)

        preview = preview_merge(source_ids=[a.pk, b.pk], target_id=t.pk)

        self.assertEqual(preview.target_id, t.pk)
        self.assertEqual(set(preview.source_ids), {a.pk, b.pk})
        self.assertEqual(preview.target_name, t.full_name)
        self.assertGreater(len(preview.field_changes), 0)
        self.assertGreater(len(preview.related_changes), 0)
        self.assertEqual(preview.conflicts, [])

    def test_preview_source_cannot_be_target(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        with self.assertRaises(MergeValidationError) as ctx:
            preview_merge(source_ids=[a.pk, t.pk], target_id=t.pk)
        self.assertIn("cannot also be a source", str(ctx.exception))

    def test_preview_already_merged_source_rejected(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")
        a.merged_into = t
        a.save()

        with self.assertRaises(MergeValidationError) as ctx:
            preview_merge(source_ids=[a.pk], target_id=t.pk)
        self.assertIn("already been merged", str(ctx.exception))

    def test_preview_already_merged_target_rejected(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")
        other = self._make_client(first_name="Other")
        t.merged_into = other
        t.save()

        with self.assertRaises(MergeValidationError) as ctx:
            preview_merge(source_ids=[a.pk], target_id=t.pk)
        self.assertIn("has already been merged", str(ctx.exception))

    def test_preview_counts_related_objects(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        preview = preview_merge(source_ids=[a.pk], target_id=t.pk)

        # Check that each relation type appears with count > 0
        relation_names = {rc.relation_name for rc in preview.related_changes if rc.will_move > 0}
        self.assertIn("client_profile_notes", relation_names)
        self.assertIn("contacts", relation_names)
        self.assertIn("hmis_profiles", relation_names)
        self.assertIn("household_members", relation_names)
        self.assertIn("social_media_profiles", relation_names)
        self.assertIn("client_profile_service_requests", relation_names)

    def test_preview_documents_counted(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        preview = preview_merge(source_ids=[a.pk], target_id=t.pk)

        # Attachment (documents) via GFK should appear
        att_models = {rc.model_label for rc in preview.related_changes if "attachment" in rc.model_label.lower()}
        self.assertTrue(att_models, "Attachment model should appear in related changes")

    def test_preview_conflict_on_unique_fields(self) -> None:
        a = self._make_client(first_name="Alice", email="alice@test.com")
        t = self._make_client(first_name="Target", email="target@test.com")

        preview = preview_merge(source_ids=[a.pk], target_id=t.pk)

        self.assertTrue(any("email" in c for c in preview.conflicts))


# ---------------------------------------------------------------------------
# execute_merge tests
# ---------------------------------------------------------------------------


class ExecuteMergeTest(MergeServiceTestCase):
    def test_basic_merge(self) -> None:
        a = self._make_client(first_name="Alice", last_name="One")
        t = self._make_client(first_name="Target", last_name="Two")

        a_note_count = Note.objects.filter(client_profile=a).count()
        t_note_count_before = Note.objects.filter(client_profile=t).count()

        result = execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        # Target survives
        self.assertEqual(result.pk, t.pk)
        self.assertIsNotNone(ClientProfile.objects.get(pk=t.pk))

        # Source marked as merged
        a.refresh_from_db()
        self.assertEqual(a.merged_into_id, t.pk)
        self.assertIsNotNone(a.merged_at)
        self.assertIsNotNone(a.merged_data)

        # Notes moved to target
        self.assertEqual(Note.objects.filter(client_profile=a).count(), 0)
        self.assertEqual(
            Note.objects.filter(client_profile=t).count(),
            t_note_count_before + a_note_count,
        )

    def test_merge_clears_unique_fields_on_source(self) -> None:
        unique_ca = f"A{secrets.randbelow(9000000) + 1000000}"
        a = self._make_client(first_name="Alice", california_id=unique_ca)
        t = self._make_client(first_name="Target")

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        self.assertIsNone(a.email)
        self.assertIsNone(a.california_id)

    def test_merge_target_scalar_wins(self) -> None:
        a = self._make_client(first_name="Alice", last_name="Doe")
        t = self._make_client(first_name="Target", last_name="Smith")

        result = execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        result.refresh_from_db()
        self.assertEqual(result.first_name, "Target")  # target wins
        self.assertEqual(result.last_name, "Smith")  # target wins

    def test_merge_fills_target_nulls(self) -> None:
        a = self._make_client(first_name="Alice", nickname="Al")
        t = self._make_client(first_name="Target", nickname=None)

        result = execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        result.refresh_from_db()
        self.assertEqual(result.nickname, "Al")  # filled from source

    def test_merge_moves_documents(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")
        ct = ContentType.objects.get_for_model(ClientProfile)

        a_doc_count = Attachment.objects.filter(content_type=ct, object_id=a.pk).count()
        t_doc_before = Attachment.objects.filter(content_type=ct, object_id=t.pk).count()

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        self.assertEqual(Attachment.objects.filter(content_type=ct, object_id=a.pk).count(), 0)
        self.assertEqual(
            Attachment.objects.filter(content_type=ct, object_id=t.pk).count(),
            t_doc_before + a_doc_count,
        )

    def test_merge_moves_contacts(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        a_contacts = ClientContact.objects.filter(client_profile=a).count()
        t_before = ClientContact.objects.filter(client_profile=t).count()

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        self.assertEqual(ClientContact.objects.filter(client_profile=a).count(), 0)
        self.assertEqual(ClientContact.objects.filter(client_profile=t).count(), t_before + a_contacts)

    def test_merge_moves_hmis_profiles(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        a_count = HmisProfile.objects.filter(client_profile=a).count()
        t_before = HmisProfile.objects.filter(client_profile=t).count()

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        self.assertEqual(HmisProfile.objects.filter(client_profile=a).count(), 0)
        self.assertEqual(HmisProfile.objects.filter(client_profile=t).count(), t_before + a_count)

    def test_merge_multiple_sources(self) -> None:
        a = self._make_client(first_name="Alice")
        b = self._make_client(first_name="Bob")
        t = self._make_client(first_name="Target")

        a_note_ids = set(Note.objects.filter(client_profile=a).values_list("pk", flat=True))
        b_note_ids = set(Note.objects.filter(client_profile=b).values_list("pk", flat=True))
        t_before = Note.objects.filter(client_profile=t).count()

        execute_merge(source_ids=[a.pk, b.pk], target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        b.refresh_from_db()
        self.assertEqual(a.merged_into_id, t.pk)
        self.assertEqual(b.merged_into_id, t.pk)
        self.assertEqual(
            Note.objects.filter(client_profile=t).count(),
            t_before + len(a_note_ids) + len(b_note_ids),
        )

    def test_merge_stores_snapshot(self) -> None:
        a = self._make_client(first_name="Alice")
        a_email = a.email  # baker auto-generates unique email
        t = self._make_client(first_name="Target")

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        snapshot = a.merged_data
        self.assertIsNotNone(snapshot)
        self.assertIn("first_name", snapshot or {})
        self.assertIn("email", snapshot or {})
        self.assertEqual((snapshot or {}).get("email"), a_email)

    def test_merge_rejects_empty_source_list(self) -> None:
        t = self._make_client(first_name="Target")
        with self.assertRaises(MergeValidationError):
            execute_merge(source_ids=[], target_id=t.pk, performed_by=self._user)


# ---------------------------------------------------------------------------
# undo_merge tests
# ---------------------------------------------------------------------------


class UndoMergeTest(MergeServiceTestCase):
    def test_undo_restores_notes(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        a_note_ids = set(Note.objects.filter(client_profile=a).values_list("pk", flat=True))
        a_note_count = len(a_note_ids)
        t_before = Note.objects.filter(client_profile=t).count()

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        # Verify moved
        self.assertEqual(Note.objects.filter(client_profile=a).count(), 0)
        self.assertEqual(Note.objects.filter(client_profile=t).count(), t_before + a_note_count)

        # Undo
        restored = undo_merge(target_id=t.pk, performed_by=self._user)

        self.assertEqual(len(restored), 1)
        self.assertEqual(restored[0].pk, a.pk)

        a.refresh_from_db()
        self.assertIsNone(a.merged_into)

        # Notes restored
        self.assertEqual(set(Note.objects.filter(client_profile=a).values_list("pk", flat=True)), a_note_ids)

        # Target notes back to original
        self.assertEqual(Note.objects.filter(client_profile=t).count(), t_before)

    def test_undo_restores_scalar_fields(self) -> None:
        a = self._make_client(first_name="Alice")
        a_email = a.email  # baker auto-generated unique email
        t = self._make_client(first_name="Target")

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        self.assertIsNone(a.email)  # cleared during merge

        undo_merge(target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        self.assertEqual(a.email, a_email)  # restored
        self.assertEqual(a.first_name, "Alice")

    def test_undo_restores_documents(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")
        ct = ContentType.objects.get_for_model(ClientProfile)

        a_doc_ids = set(Attachment.objects.filter(content_type=ct, object_id=a.pk).values_list("pk", flat=True))
        t_doc_before = set(Attachment.objects.filter(content_type=ct, object_id=t.pk).values_list("pk", flat=True))

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)

        # Undo
        undo_merge(target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        restored_a_docs = set(Attachment.objects.filter(content_type=ct, object_id=a.pk).values_list("pk", flat=True))
        self.assertEqual(restored_a_docs, a_doc_ids)

        restored_t_docs = set(Attachment.objects.filter(content_type=ct, object_id=t.pk).values_list("pk", flat=True))
        self.assertEqual(restored_t_docs, t_doc_before)

    def test_undo_clears_merge_markers(self) -> None:
        a = self._make_client(first_name="Alice")
        t = self._make_client(first_name="Target")

        execute_merge(source_ids=[a.pk], target_id=t.pk, performed_by=self._user)
        undo_merge(target_id=t.pk, performed_by=self._user)

        a.refresh_from_db()
        self.assertIsNone(a.merged_into)
        self.assertIsNone(a.merged_at)
        self.assertIsNone(a.merged_data)

    def test_undo_no_sources_raises(self) -> None:
        t = self._make_client(first_name="Target")
        with self.assertRaises(MergeValidationError) as ctx:
            undo_merge(target_id=t.pk, performed_by=self._user)
        self.assertIn("No merged sources", str(ctx.exception))
