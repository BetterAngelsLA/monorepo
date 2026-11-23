"""Create ``analytics_client_summary``, the privacy-safe surface for the PostHog spike.

One row per active (unmerged) client, carrying only presence flags, counts, and
timestamps — no name, contact detail, ID number, address, or free text. That is what
makes it safe to hand to a third party: the view exposes nothing to leak, so the grant
can be ``SELECT`` on this one object instead of a column allowlist on
``clients_clientprofile`` that someone can widen by accident.

**``updated_at`` is surfaced raw, and it overcounts.** The database records a client as
updated on any save, including one that changes nothing, so "updated in the last 90
days" read straight off it comes out too high. That is deliberate: what counts as a real
change is a product decision, not something to settle inside a reporting view. The spike
shows the PM the raw number and asks how wrong it looks; the follow-up tightens it. The
material for that follow-up is already recorded — ``pghistory`` writes
``client_profile.add`` and ``client_profile.update`` separately, and a no-op save can be
told from a real one by comparing consecutive events for the same client.

A plain view, not a materialized one — it is always current, needs no refresh
machinery, and at this row count the join is cheap. Materialize it only if the reports
actually get slow.

Purely additive: the reverse is a drop, and nothing else depends on it.
"""

from django.db import migrations

SUMMARY_VIEW = "analytics_client_summary"

# `CREATE OR REPLACE` so a later field-list change is a one-line edit that keeps the
# name, rather than a drop-and-recreate that breaks anything pointed at it.
CREATE_SUMMARY_VIEW = f"""
CREATE OR REPLACE VIEW {SUMMARY_VIEW} AS
WITH
client_content_type AS (
    SELECT ct.id AS content_type_id
    FROM django_content_type ct
    WHERE ct.app_label = 'clients' AND ct.model = 'clientprofile'
),
task_rollup AS (
    SELECT
        t.client_profile_id AS client_id,
        count(*) AS task_count,
        count(*) FILTER (WHERE t.assignee_id IS NOT NULL) AS task_assigned_count,
        count(*) FILTER (WHERE t.status = 2) AS task_completed_count
    FROM tasks_task t
    WHERE t.client_profile_id IS NOT NULL
    GROUP BY t.client_profile_id
),
-- A task has an assignee and a status; it has no due date. `due_by` lives on the
-- requested service, so the due-date columns are counted there, not here.
service_request_rollup AS (
    SELECT
        sr.client_profile_id AS client_id,
        count(*) AS service_request_count,
        count(*) FILTER (WHERE sr.due_by IS NOT NULL) AS service_request_due_count,
        count(*) FILTER (
            WHERE sr.due_by IS NOT NULL AND sr.due_by < now() AND sr.completed_on IS NULL
        ) AS service_request_overdue_count
    FROM notes_servicerequest sr
    WHERE sr.client_profile_id IS NOT NULL
    GROUP BY sr.client_profile_id
),
phone_rollup AS (
    SELECT pn.object_id AS client_id, count(*) AS phone_number_count
    FROM common_phonenumber pn
    JOIN client_content_type cct ON cct.content_type_id = pn.content_type_id
    GROUP BY pn.object_id
),
document_rollup AS (
    SELECT a.object_id AS client_id, count(*) AS document_count
    FROM common_attachment a
    JOIN client_content_type cct ON cct.content_type_id = a.content_type_id
    GROUP BY a.object_id
),
hmis_rollup AS (
    SELECT h.client_profile_id AS client_id, count(*) AS hmis_profile_count
    FROM clients_hmisprofile h
    GROUP BY h.client_profile_id
),
-- Sub-records are counted, not flagged: the count answers "does this client have an
-- emergency contact" (count > 0) and "how many" in one column, and drilling into the
-- individual contacts is a later iteration rather than a new view now.
contact_rollup AS (
    SELECT c.client_profile_id AS client_id, count(*) AS contact_count
    FROM clients_clientcontact c
    GROUP BY c.client_profile_id
),
household_member_rollup AS (
    SELECT m.client_profile_id AS client_id, count(*) AS household_member_count
    FROM clients_clienthouseholdmember m
    GROUP BY m.client_profile_id
),
social_media_rollup AS (
    SELECT sm.client_profile_id AS client_id, count(*) AS social_media_profile_count
    FROM clients_socialmediaprofile sm
    GROUP BY sm.client_profile_id
)
SELECT
    -- The internal primary key, not a client identifier: it joins back to
    -- `clients_clientprofile` and `tasks_task`, and a report writer needs that. A hash
    -- of a small sequential integer would obscure nothing while making the join
    -- impossible.
    cp.id AS client_id,
    cp.created_at AS client_created_at,
    -- Raw, and inflated by no-op saves: what counts as a real change is deferred.
    cp.updated_at AS client_updated_at,

    cp.date_of_birth IS NOT NULL AS has_date_of_birth,
    nullif(btrim(cp.california_id), '') IS NOT NULL AS has_california_id,
    nullif(btrim(cp.email), '') IS NOT NULL AS has_email,
    (
        nullif(btrim(cp.phone_number), '') IS NOT NULL
        OR coalesce(pn.phone_number_count, 0) > 0
    ) AS has_phone_number,
    nullif(btrim(cp.address), '') IS NOT NULL AS has_address,
    nullif(btrim(cp.mailing_address), '') IS NOT NULL AS has_mailing_address,
    nullif(btrim(cp.race), '') IS NOT NULL AS has_race,
    nullif(btrim(cp.veteran_status), '') IS NOT NULL AS has_veteran_status,
    nullif(btrim(cp.living_situation), '') IS NOT NULL AS has_living_situation,
    nullif(btrim(cp.marital_status), '') IS NOT NULL AS has_marital_status,
    nullif(btrim(cp.gender), '') IS NOT NULL AS has_gender,
    (
        nullif(btrim(cp.pronouns), '') IS NOT NULL
        OR nullif(btrim(cp.pronouns_other), '') IS NOT NULL
    ) AS has_pronouns,
    nullif(btrim(cp.preferred_language), '') IS NOT NULL AS has_preferred_language,
    nullif(btrim(cp.important_notes), '') IS NOT NULL AS has_important_notes,
    nullif(btrim(cp.profile_photo), '') IS NOT NULL AS has_profile_photo,
    coalesce(h.hmis_profile_count, 0) > 0 AS has_hmis_profile,
    coalesce(d.document_count, 0) AS client_document_count,

    coalesce(c.contact_count, 0) AS contact_count,
    coalesce(m.household_member_count, 0) AS household_member_count,
    coalesce(sm.social_media_profile_count, 0) AS social_media_profile_count,

    coalesce(t.task_count, 0) AS task_count,
    coalesce(t.task_assigned_count, 0) AS task_assigned_count,
    coalesce(t.task_completed_count, 0) AS task_completed_count,

    coalesce(sr.service_request_count, 0) AS service_request_count,
    coalesce(sr.service_request_due_count, 0) AS service_request_due_count,
    coalesce(sr.service_request_overdue_count, 0) AS service_request_overdue_count
FROM clients_clientprofile cp
LEFT JOIN task_rollup t ON t.client_id = cp.id
LEFT JOIN service_request_rollup sr ON sr.client_id = cp.id
LEFT JOIN phone_rollup pn ON pn.client_id = cp.id
LEFT JOIN document_rollup d ON d.client_id = cp.id
LEFT JOIN hmis_rollup h ON h.client_id = cp.id
LEFT JOIN contact_rollup c ON c.client_id = cp.id
LEFT JOIN household_member_rollup m ON m.client_id = cp.id
LEFT JOIN social_media_rollup sm ON sm.client_id = cp.id
-- Merged profiles are hidden by `ClientProfileManager`, so a view that kept them would
-- disagree with every count the product reports.
WHERE cp.merged_into_id IS NULL
"""

DROP_SUMMARY_VIEW = f"DROP VIEW IF EXISTS {SUMMARY_VIEW}"


class Migration(migrations.Migration):
    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("common", "0005_backfill_attachment_upload_org"),
        ("clients", "0002_initial"),
        ("notes", "0004_alter_note_team"),
        ("tasks", "0006_task_assignee"),
        ("reports", "0002_report_schedule_local_time"),
    ]

    operations = [
        migrations.RunSQL(CREATE_SUMMARY_VIEW, DROP_SUMMARY_VIEW),
    ]
