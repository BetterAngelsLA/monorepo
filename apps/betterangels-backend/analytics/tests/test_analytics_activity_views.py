"""Tests for the client activity views.

Two properties per view, matching the spike's invariants:

* the column list is exactly the agreed allowlist — adding a free-text or identifying
  column has to fail here, not in a review;
* the grain is what it claims, so a chart grouped by these columns counts what the PM
  expects.

The per-entity views are the ones worth testing with data: a wrong join direction in
``analytics_note_provided_service`` still produces rows, just the wrong number of them.
"""

import pytest
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from model_bakery import baker

from accounts.models import Organization
from clients.models import ClientProfile
from common.models import Attachment
from hmis.models import HmisNote
from notes.models import Note, OrganizationService, ServiceRequest
from referrals.models import Referral
from tasks.models import Task

VIEW_COLUMNS: dict[str, frozenset[str]] = {
    "analytics_client_interaction": frozenset(
        {
            "client_id",
            "note_id",
            "note_interacted_at",
            "note_created_at",
            "note_updated_at",
            "has_purpose",
            "is_submitted",
            "note_organization_id",
            "note_team_id",
            "has_location",
            "has_creator",
            "has_public_details",
            "has_private_details",
            "note_provided_service_count",
            "note_requested_service_count",
            "note_document_count",
        }
    ),
    "analytics_note_provided_service": frozenset(
        {
            "note_service_link_id",
            "note_service_direction",
            "client_id",
            "note_id",
            "service_request_id",
            "service_id",
            "service_label",
            "service_organization_id",
            "note_organization_id",
            "note_interacted_at",
        }
    ),
    "analytics_note_requested_service": frozenset(
        {
            "note_service_link_id",
            "note_service_direction",
            "client_id",
            "note_id",
            "service_request_id",
            "service_id",
            "service_label",
            "service_organization_id",
            "note_organization_id",
            "note_interacted_at",
        }
    ),
    "analytics_service_rollup": frozenset(
        {
            "note_organization_id",
            "service_category",
            "service_label",
            "note_service_direction",
            "service_use_count",
            "distinct_client_count",
            "distinct_note_count",
            "last_used_at",
        }
    ),
    "analytics_client_task": frozenset(
        {
            "client_id",
            "task_id",
            "task_status",
            "is_assigned",
            "has_summary",
            "has_description",
            "task_organization_id",
            "task_team_id",
            "task_origin",
            "has_creator",
            "task_created_at",
            "task_updated_at",
        }
    ),
    "analytics_client_document": frozenset(
        {
            "client_id",
            "attachment_id",
            "attachment_type",
            "document_namespace",
            "mime_type",
            "attachment_organization_id",
            "has_original_filename",
            "has_uploader",
            "document_created_at",
            "document_updated_at",
        }
    ),
    "analytics_client_referral": frozenset(
        {
            "client_id",
            "referral_id",
            "referral_status",
            "shelter_id",
            "referral_organization_id",
            "has_referral_notes",
            "has_creator",
            "referral_created_at",
            "referral_updated_at",
        }
    ),
}


def columns_of(view: str) -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'analytics' AND table_name = %s
            """,
            [view],
        )
        return {row[0] for row in cursor.fetchall()}


def rows_of(view: str) -> list[dict[str, object]]:
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM analytics.{view}")
        column_names = [column[0] for column in cursor.description or ()]
        return [dict(zip(column_names, row)) for row in cursor.fetchall()]


@pytest.mark.django_db
@pytest.mark.parametrize(("view", "expected"), VIEW_COLUMNS.items())
def test_view_exposes_only_the_agreed_columns(view: str, expected: frozenset[str]) -> None:
    assert columns_of(view) == set(expected)


@pytest.mark.django_db
def test_service_link_views_record_both_directions_separately() -> None:
    org = baker.make(Organization)
    client = baker.make(ClientProfile, first_name="Dale")
    catalogue = baker.make(OrganizationService, organization=org, label="Tarp")
    provided = baker.make(ServiceRequest, service=catalogue, client_profile=client)
    requested = baker.make(ServiceRequest, service=catalogue, client_profile=client)

    note = baker.make(Note, client_profile=client, organization=org)
    note.provided_services.add(provided)
    note.requested_services.add(requested)

    assert [
        (row["note_service_direction"], row["service_id"], row["service_label"])
        for row in rows_of("analytics_note_provided_service")
    ] == [("provided", catalogue.pk, "Tarp")]
    assert [
        (row["note_service_direction"], row["service_id"], row["service_label"])
        for row in rows_of("analytics_note_requested_service")
    ] == [("requested", catalogue.pk, "Tarp")]

    rollup = {
        (row["note_service_direction"], row["service_label"], row["service_use_count"], row["distinct_client_count"])
        for row in rows_of("analytics_service_rollup")
    }
    assert rollup == {("provided", "Tarp", 1, 1), ("requested", "Tarp", 1, 1)}


@pytest.mark.django_db
def test_status_enums_export_as_labels() -> None:
    """A ``0/1/2`` is a guess for every consumer of the export; the label is not."""
    client = baker.make(ClientProfile, first_name="Dale")
    baker.make(Task, client_profile=client, summary="Follow up", status=Task.Status.COMPLETED)
    baker.make(Referral, client_profile=client, status=Referral.Status.ACCEPTED)

    (task,) = rows_of("analytics_client_task")
    (referral,) = rows_of("analytics_client_referral")

    assert task["task_status"] == "completed"
    assert referral["referral_status"] == "accepted"


@pytest.mark.django_db
def test_removing_a_link_drops_it_from_the_views() -> None:
    """The views are live, so a removal shows up here.

    Append-only is a property of a synced copy driven by a cursor, not of the view: a
    consumer syncing on `note_service_link_id` would keep the removed row. This test pins the half
    that lives in our database so the difference stays visible.
    """
    org = baker.make(Organization)
    client = baker.make(ClientProfile, first_name="Dale")
    catalogue = baker.make(OrganizationService, organization=org, label="Tarp")
    provided = baker.make(ServiceRequest, service=catalogue, client_profile=client)
    note = baker.make(Note, client_profile=client, organization=org)
    note.provided_services.add(provided)

    assert len(rows_of("analytics_note_provided_service")) == 1

    note.provided_services.remove(provided)

    assert rows_of("analytics_note_provided_service") == []
    assert rows_of("analytics_service_rollup") == []


@pytest.mark.django_db
def test_service_views_skip_notes_without_a_client() -> None:
    org = baker.make(Organization)
    unassigned = baker.make(Note, client_profile=None, organization=org)
    unassigned.provided_services.add(baker.make(ServiceRequest, client_profile=None))

    assert rows_of("analytics_note_provided_service") == []
    assert rows_of("analytics_client_interaction") == []


@pytest.mark.django_db
def test_task_presence_flags_do_not_expose_the_text() -> None:
    client = baker.make(ClientProfile, first_name="Dale")
    baker.make(Task, client_profile=client, summary="Follow up", description=None)

    (row,) = rows_of("analytics_client_task")

    # `summary` is required, so its flag is always true — kept for a uniform surface.
    assert row["has_summary"] is True
    assert row["has_description"] is False
    assert "Follow up" not in str(row.values())


@pytest.mark.django_db
def test_task_origin_covers_every_parent_kind() -> None:
    """A boolean would report an HMIS-parented task as having no parent at all."""
    org = baker.make(Organization)
    client = baker.make(ClientProfile, first_name="Dale")
    note = baker.make(Note, client_profile=client, organization=org)
    hmis_note = baker.make(HmisNote)

    baker.make(Task, client_profile=client, summary="From a note", note=note)
    baker.make(Task, client_profile=client, summary="From an HMIS note", hmis_note=hmis_note)
    baker.make(Task, client_profile=client, summary="No parent")

    origins = sorted(str(row["task_origin"]) for row in rows_of("analytics_client_task"))

    assert origins == ["hmis_note", "note", "standalone"]


@pytest.mark.django_db
def test_attachment_count_only_counts_note_attachments() -> None:
    """Client documents and note attachments share one table, split by content type."""
    org = baker.make(Organization)
    client = baker.make(ClientProfile, first_name="Dale")
    note = baker.make(Note, client_profile=client, organization=org)

    baker.make(
        Attachment,
        content_type=ContentType.objects.get_for_model(Note),
        object_id=note.pk,
        mime_type="application/pdf",
    )
    baker.make(
        Attachment,
        content_type=ContentType.objects.get_for_model(ClientProfile),
        object_id=client.pk,
        mime_type="application/pdf",
    )

    (interaction,) = rows_of("analytics_client_interaction")

    assert interaction["note_document_count"] == 1
    assert len(rows_of("analytics_client_document")) == 1
