"""Tests for the client activity views.

Two properties per view, matching the spike's invariants:

* the column list is exactly the agreed allowlist — adding a free-text or identifying
  column has to fail here, not in a review;
* the grain is what it claims, so a chart grouped by these columns counts what the PM
  expects.

The per-entity views are the ones worth testing with data: a wrong join direction in
``analytics_note_provided_service`` still produces rows, just the wrong number of them.
"""

from datetime import timedelta

import pytest
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from django.utils import timezone
from model_bakery import baker

from accounts.models import Organization
from clients.models import ClientProfile
from common.models import Attachment
from notes.enums import ServiceRequestStatusEnum
from notes.models import Note, OrganizationService, ServiceRequest
from tasks.models import Task

VIEW_COLUMNS: dict[str, frozenset[str]] = {
    "analytics_client_interaction": frozenset(
        {
            "client_id",
            "note_id",
            "interacted_at",
            "created_at",
            "updated_at",
            "purpose",
            "has_purpose",
            "is_submitted",
            "organization_id",
            "team_id",
            "has_team",
            "has_location",
            "has_creator",
            "has_public_details",
            "has_private_details",
            "provided_service_count",
            "requested_service_count",
            "attachment_count",
        }
    ),
    "analytics_note_provided_service": frozenset(
        {
            "link_id",
            "kind",
            "client_id",
            "note_id",
            "service_request_id",
            "service_label",
            "service_organization_id",
            "organization_id",
            "interacted_at",
            "status",
            "has_due_date",
            "due_by",
            "completed_on",
        }
    ),
    "analytics_note_requested_service": frozenset(
        {
            "link_id",
            "kind",
            "client_id",
            "note_id",
            "service_request_id",
            "service_label",
            "service_organization_id",
            "organization_id",
            "interacted_at",
            "status",
            "has_due_date",
            "due_by",
            "completed_on",
        }
    ),
    "analytics_service_rollup": frozenset(
        {
            "organization_id",
            "service_category",
            "service_label",
            "kind",
            "link_count",
            "client_count",
            "note_count",
            "last_interacted_at",
        }
    ),
    "analytics_client_service_request": frozenset(
        {
            "client_id",
            "service_request_id",
            "service_label",
            "service_organization_id",
            "status",
            "has_service",
            "has_due_date",
            "due_by",
            "completed_on",
            "is_overdue",
            "created_at",
            "updated_at",
        }
    ),
    "analytics_client_task": frozenset(
        {
            "client_id",
            "task_id",
            "status",
            "is_assigned",
            "has_summary",
            "has_description",
            "organization_id",
            "team_id",
            "has_team",
            "has_note",
            "has_creator",
            "created_at",
            "updated_at",
        }
    ),
    "analytics_client_document": frozenset(
        {
            "client_id",
            "attachment_id",
            "attachment_type",
            "namespace",
            "mime_type",
            "upload_org_id",
            "has_original_filename",
            "has_uploader",
            "created_at",
            "updated_at",
        }
    ),
    "analytics_client_referral": frozenset(
        {
            "client_id",
            "referral_id",
            "status",
            "shelter_id",
            "has_shelter",
            "organization_id",
            "has_notes",
            "has_creator",
            "created_at",
            "updated_at",
        }
    ),
}


def columns_of(view: str) -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = %s
            """,
            [view],
        )
        return {row[0] for row in cursor.fetchall()}


def rows_of(view: str) -> list[dict[str, object]]:
    with connection.cursor() as cursor:
        cursor.execute(f"SELECT * FROM {view}")
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

    assert [(row["kind"], row["service_label"]) for row in rows_of("analytics_note_provided_service")] == [
        ("provided", "Tarp")
    ]
    assert [(row["kind"], row["service_label"]) for row in rows_of("analytics_note_requested_service")] == [
        ("requested", "Tarp")
    ]

    rollup = {
        (row["kind"], row["service_label"], row["link_count"], row["client_count"])
        for row in rows_of("analytics_service_rollup")
    }
    assert rollup == {("provided", "Tarp", 1, 1), ("requested", "Tarp", 1, 1)}


@pytest.mark.django_db
def test_removing_a_link_drops_it_from_the_views() -> None:
    """The views are live, so a removal shows up here.

    Append-only is a property of a synced copy driven by a cursor, not of the view: a
    consumer syncing on `link_id` would keep the removed row. This test pins the half
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
def test_service_request_overdue_excludes_completed() -> None:
    """A request that finished late was late; it is not still overdue."""
    client = baker.make(ClientProfile, first_name="Dale")
    past = timezone.now() - timedelta(days=30)

    baker.make(
        ServiceRequest,
        client_profile=client,
        service=None,
        status=ServiceRequestStatusEnum.TO_DO,
        due_by=past,
        completed_on=None,
    )
    baker.make(
        ServiceRequest,
        client_profile=client,
        service=None,
        status=ServiceRequestStatusEnum.COMPLETED,
        due_by=past,
        completed_on=past,
    )

    overdue = {row["is_overdue"] for row in rows_of("analytics_client_service_request")}

    assert overdue == {True, False}


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

    assert interaction["attachment_count"] == 1
    assert len(rows_of("analytics_client_document")) == 1
