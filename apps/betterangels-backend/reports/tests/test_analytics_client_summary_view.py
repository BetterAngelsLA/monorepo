"""Tests for the ``analytics_client_summary`` reporting view.

These pin the two properties the PostHog spike depends on, not the numbers in it:

* the view exposes no client-identifying column, and
* the timestamp it surfaces is the raw ``updated_at`` — inflated by no-op saves on
  purpose, because the definition of a real change is deferred to Product.

The second is easy to "helpfully" fix later. It should fail loudly if someone starts
filtering, so the number the PM is shown keeps matching the number we told them to
expect.
"""

from datetime import datetime

import pytest
from django.db import connection
from model_bakery import baker

from clients.models import ClientContact, ClientHouseholdMember, ClientProfile, SocialMediaProfile

# The complete column list, not a forbidden-name check: adding a client-identifying
# column has to fail this test, and so does dropping one the reports read.
EXPECTED_COLUMNS = frozenset(
    {
        "client_id",
        "client_created_at",
        "client_updated_at",
        "has_date_of_birth",
        "has_california_id",
        "has_email",
        "has_phone_number",
        "has_address",
        "has_mailing_address",
        "has_race",
        "has_veteran_status",
        "has_living_situation",
        "has_marital_status",
        "has_gender",
        "has_pronouns",
        "has_preferred_language",
        "has_important_notes",
        "has_profile_photo",
        "has_hmis_profile",
        "client_document_count",
        "contact_count",
        "household_member_count",
        "social_media_profile_count",
        "task_count",
        "task_assigned_count",
        "task_completed_count",
        "service_request_count",
        "service_request_due_count",
        "service_request_overdue_count",
    }
)


def view_columns() -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = 'analytics_client_summary'
            """
        )
        return {row[0] for row in cursor.fetchall()}


def summary_row(client: ClientProfile) -> dict[str, object] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM analytics_client_summary WHERE client_id = %s",
            [client.pk],
        )
        column_names = [column[0] for column in cursor.description or ()]
        row = cursor.fetchone()

    if row is None:
        return None

    return dict(zip(column_names, row, strict=True))


def timestamp(row: dict[str, object], column: str) -> datetime:
    """Narrow a raw column to ``datetime``.

    ``summary_row`` widens every value to ``object``, which a comparison cannot use;
    this asserts the column really is a timestamp instead of casting past the check.
    """
    value = row[column]
    assert isinstance(value, datetime), f"{column} is not a timestamp: {value!r}"
    return value


@pytest.mark.django_db
def test_view_exposes_only_the_agreed_columns() -> None:
    assert view_columns() == EXPECTED_COLUMNS


@pytest.mark.django_db
def test_a_no_op_save_still_bumps_updated_at() -> None:
    """Pins the overcount deliberately — the raw column is what the spike surfaces.

    A save that changes nothing moves ``updated_at``, so "updated in the last 90 days"
    reads high. Product decides what a real change is before this gets tightened; until
    then this test keeps the surfaced number matching what we told the PM to expect.
    """
    client = baker.make(ClientProfile, first_name="Unchanged")

    before = summary_row(client)
    assert before is not None

    client.save()  # `updated_at` moves; nothing else does.

    after = summary_row(client)
    assert after is not None
    assert timestamp(after, "client_updated_at") > timestamp(before, "client_updated_at")


@pytest.mark.django_db
def test_sub_record_counts() -> None:
    client = baker.make(ClientProfile, first_name="Dale")
    for _ in range(2):
        baker.make(ClientContact, client_profile=client)
    baker.make(ClientHouseholdMember, client_profile=client)
    baker.make(SocialMediaProfile, client_profile=client)

    row = summary_row(client)
    assert row is not None
    assert row["contact_count"] == 2
    assert row["household_member_count"] == 1
    assert row["social_media_profile_count"] == 1


@pytest.mark.django_db
def test_sub_record_counts_are_zero_without_records() -> None:
    """A left join that resolves to null must still report 0, not blank."""
    client = baker.make(ClientProfile, first_name="Dale")

    row = summary_row(client)
    assert row is not None
    assert row["contact_count"] == 0
    assert row["household_member_count"] == 0
    assert row["social_media_profile_count"] == 0


@pytest.mark.django_db
def test_merged_profiles_are_excluded() -> None:
    survivor = baker.make(ClientProfile, first_name="Survivor")
    merged = baker.make(ClientProfile, first_name="Merged", merged_into=survivor)

    assert summary_row(survivor) is not None
    # The default manager hides merged profiles; the view has to agree with it or every
    # count it produces will disagree with the product's own.
    assert summary_row(merged) is None
