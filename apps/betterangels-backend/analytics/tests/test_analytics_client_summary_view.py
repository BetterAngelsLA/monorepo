"""Tests for the ``analytics_client_summary`` reporting view.

These pin the two properties the PostHog spike depends on, not the numbers in it:

* the view exposes no client-identifying column, and
* the timestamp it surfaces is the raw ``updated_at`` — inflated by no-op saves on
  purpose, because the definition of a real change is deferred to Product.

The second is easy to "helpfully" fix later. It should fail loudly if someone starts
filtering, so the number the PM is shown keeps matching the number we told them to
expect.
"""

from datetime import date, datetime

import pytest
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from model_bakery import baker

from clients.enums import RelationshipTypeEnum
from clients.models import ClientContact, ClientHouseholdMember, ClientProfile, SocialMediaProfile
from common.models import PhoneNumber

# The complete column list, not a forbidden-name check: adding a client-identifying
# column has to fail this test, and so does dropping one the reports read.
EXPECTED_COLUMNS = frozenset(
    {
        "client_id",
        "client_created_at",
        "client_last_saved_at",
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
        "current_case_manager_count",
        "household_member_count",
        "social_media_profile_count",
        "client_task_count",
        "client_task_assigned_count",
        "client_task_completed_count",
    }
)


def view_columns() -> set[str]:
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'analytics' AND table_name = 'analytics_client_summary'
            """
        )
        return {row[0] for row in cursor.fetchall()}


def summary_row(client: ClientProfile) -> dict[str, object] | None:
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT * FROM analytics.analytics_client_summary WHERE client_id = %s",
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
def test_a_no_op_save_still_moves_client_last_saved_at() -> None:
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
    assert timestamp(after, "client_last_saved_at") > timestamp(before, "client_last_saved_at")


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
def test_current_case_manager_count() -> None:
    """The client profile lists current case managers separately, and allows more than one."""
    client = baker.make(ClientProfile, first_name="Dale")
    for _ in range(2):
        baker.make(
            ClientContact,
            client_profile=client,
            relationship_to_client=RelationshipTypeEnum.CURRENT_CASE_MANAGER,
        )
    baker.make(ClientContact, client_profile=client, relationship_to_client=RelationshipTypeEnum.MOTHER)

    row = summary_row(client)
    assert row is not None
    assert row["current_case_manager_count"] == 2
    assert row["contact_count"] == 3


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


@pytest.mark.django_db
def test_presence_flags_reflect_only_recorded_values() -> None:
    """A field holding ``''`` or spaces is not data, so the flag has to say so."""
    blank = baker.make(
        ClientProfile,
        first_name="Blank",
        california_id="   ",
        email="",
        pronouns=None,
        pronouns_other="  ",
        important_notes="   ",
        date_of_birth=None,
    )
    filled = baker.make(
        ClientProfile,
        first_name="Filled",
        california_id="abc123",
        email="filled@example.com",
        pronouns=None,
        pronouns_other="she/her",
        important_notes="Allergic to peanuts",
        date_of_birth=date(1990, 1, 1),
    )

    blank_row = summary_row(blank)
    filled_row = summary_row(filled)
    assert blank_row is not None
    assert filled_row is not None

    for column in (
        "has_california_id",
        "has_email",
        "has_pronouns",
        "has_important_notes",
        "has_date_of_birth",
    ):
        assert blank_row[column] is False, column

    assert filled_row["has_california_id"] is True
    assert filled_row["has_email"] is True
    assert filled_row["has_pronouns"] is True
    assert filled_row["has_important_notes"] is True
    assert filled_row["has_date_of_birth"] is True


@pytest.mark.django_db
def test_has_phone_number_covers_the_generic_phone_relation() -> None:
    """``phone_number`` is the legacy column; the live one is ``common_phonenumber``."""
    legacy = baker.make(ClientProfile, first_name="Legacy", phone_number="+12125550100")
    recorded = baker.make(ClientProfile, first_name="Recorded", phone_number=None)
    PhoneNumber.objects.create(
        number="+12125550101",
        content_type=ContentType.objects.get_for_model(ClientProfile),
        object_id=recorded.pk,
    )
    without = baker.make(ClientProfile, first_name="Without", phone_number=None)

    for client, expected in ((legacy, True), (recorded, True), (without, False)):
        row = summary_row(client)
        assert row is not None
        assert row["has_phone_number"] is expected, client.first_name
