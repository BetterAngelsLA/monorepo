"""Client activity views: interactions, their services, tasks, documents, referrals.

Five read-only projections over existing tables, joining ``analytics_client_summary``
(the client dimension) on ``client_id``. Nothing is copied, refreshed, or scheduled —
each is a live view, so the daily-freshness requirement is met by the database rather
than by a pipeline we operate.

**Grains.** One row per entity, not per client:

* ``analytics_client_interaction`` — one row per ``Note`` with a client.
* ``analytics_note_provided_service`` — one row per provided-service link on a note.
* ``analytics_note_requested_service`` — one row per requested-service link on a note.
* ``analytics_service_rollup`` — one row per (organisation × service × kind).
* ``analytics_client_service_request`` — one row per ``ServiceRequest`` with a client.
* ``analytics_client_task`` — one row per ``Task`` with a client.
* ``analytics_client_document`` — one row per client ``Attachment``.
* ``analytics_client_referral`` — one row per ``Referral`` with a client.

Per-entity rows rather than pre-aggregated columns because the questions that get asked
next are time-series and sliced ("interactions per month", "tasks by status"), and a
count column cannot answer those. ``analytics_client_summary`` keeps its own counts for
the single-number questions; the duplication is deliberate.

**``has_*`` means "a value is present", not "the field is optional".** Free-text fields
and optional keys get a flag so a consumer never has to know whether the column is
required. ``has_summary`` on a task is always true today; that is fine — the surface
stays uniform, and it keeps its meaning if the constraint is ever relaxed. Categorical
fields (``status``, ``attachment_type``, ``namespace``) carry no flag: their absence is
impossible and the value is the information.

**What is deliberately not exposed.** Free text never leaves the database: note
``public_details``/``private_details``, task ``summary``/``description``, referral
``notes`` — only their presence. Note ``location_id`` is reduced to a flag: a service
location plus a timestamp is close enough to an address to be worth avoiding. Uploaded
filenames are reduced to a flag for the same reason.

**Service labels are organisation-authored text**, not a fixed enum, so they are the one
field here whose content we do not fully control. They read like catalogue entries
("Tarp", "Book") and carry no client information in practice, but an organisation could
type anything into one. Worth a look at the distinct values before the first export.

Notes with no client, and tasks linked only to an HMIS profile, are excluded: there is no
``client_id`` to key them by, so they cannot be joined to the rest.

**Every view exposes a stable key.** ``note_id``, ``task_id``, ``attachment_id``,
``referral_id`` and ``service_request_id`` are their tables' own primary keys;
``client_summary`` uses ``client_id``; the two service-link views use ``link_id``. Postgres
reports no primary key for a view, so a sync tool cannot dedupe or upsert on one unless a
column exists that it can be told to trust. ``analytics_service_rollup`` is the exception:
it has no key because it is an aggregate small enough to re-read in full.

**The service links are split in two, and are insert-only.** ``provided_services`` and
``requested_services`` are separate through-tables with separate ``id`` sequences, so one
view over both could not be incrementally synced on a single watermark — id 500 in one arm
says nothing about the other. One view per table gives each its own cursor.

The cost of that is append-only semantics: a link's ``id`` increases when it is created,
but removing a service deletes the row and leaves no higher id to sync, so a downstream
copy keeps it and counts from these two views can only overstate. That is an accepted
trade — re-reading ~600K rows daily is prohibitive — and ``analytics_service_rollup``
exists to give counts that survive deletion: it aggregates from the through-tables, so it
is always current, and it is small enough to refresh as often as you like. Track the drift
by comparing ``count(*)`` here against the synced row count; if removals turn out to be
negligible the trade costs nothing.
"""

from django.db import migrations

CREATE_INTERACTION_VIEW = """
CREATE OR REPLACE VIEW analytics_client_interaction AS
SELECT
    n.client_profile_id AS client_id,
    n.id                AS note_id,
    n.interacted_at,
    n.created_at,
    n.updated_at,
    n.purpose,
    nullif(btrim(n.purpose), '') IS NOT NULL AS has_purpose,
    n.is_submitted,
    n.organization_id,
    n.team_id,
    n.team_id IS NOT NULL      AS has_team,
    n.location_id IS NOT NULL  AS has_location,
    n.created_by_id IS NOT NULL AS has_creator,
    nullif(btrim(n.public_details), '') IS NOT NULL  AS has_public_details,
    nullif(btrim(n.private_details), '') IS NOT NULL AS has_private_details,
    coalesce(ps.provided_service_count, 0)  AS provided_service_count,
    coalesce(rs.requested_service_count, 0) AS requested_service_count,
    coalesce(at.attachment_count, 0)        AS attachment_count
FROM notes_note n
LEFT JOIN (
    SELECT note_id, count(*) AS provided_service_count
    FROM notes_note_provided_services
    GROUP BY note_id
) ps ON ps.note_id = n.id
LEFT JOIN (
    SELECT note_id, count(*) AS requested_service_count
    FROM notes_note_requested_services
    GROUP BY note_id
) rs ON rs.note_id = n.id
LEFT JOIN (
    SELECT a.object_id AS note_id, count(*) AS attachment_count
    FROM common_attachment a
    JOIN django_content_type ct ON ct.id = a.content_type_id
    WHERE ct.app_label = 'notes' AND ct.model = 'note'
    GROUP BY a.object_id
) at ON at.note_id = n.id
WHERE n.client_profile_id IS NOT NULL
"""

# One view per through-table so each has its own `link_id` cursor. A consumer that wants
# both directions unions them at query time, which costs nothing at sync time.
CREATE_PROVIDED_SERVICE_VIEW = """
CREATE OR REPLACE VIEW analytics_note_provided_service AS
SELECT
    link.id             AS link_id,
    'provided'          AS kind,
    n.client_profile_id AS client_id,
    n.id                AS note_id,
    sr.id               AS service_request_id,
    s.label             AS service_label,
    s.organization_id   AS service_organization_id,
    n.organization_id,
    n.interacted_at,
    sr.status,
    sr.due_by IS NOT NULL AS has_due_date,
    sr.due_by,
    sr.completed_on
FROM notes_note_provided_services link
JOIN notes_note n ON n.id = link.note_id
JOIN notes_servicerequest sr ON sr.id = link.servicerequest_id
LEFT JOIN notes_organizationservice s ON s.id = sr.service_id
WHERE n.client_profile_id IS NOT NULL
"""

CREATE_REQUESTED_SERVICE_VIEW = """
CREATE OR REPLACE VIEW analytics_note_requested_service AS
SELECT
    link.id             AS link_id,
    'requested'         AS kind,
    n.client_profile_id AS client_id,
    n.id                AS note_id,
    sr.id               AS service_request_id,
    s.label             AS service_label,
    s.organization_id   AS service_organization_id,
    n.organization_id,
    n.interacted_at,
    sr.status,
    sr.due_by IS NOT NULL AS has_due_date,
    sr.due_by,
    sr.completed_on
FROM notes_note_requested_services link
JOIN notes_note n ON n.id = link.note_id
JOIN notes_servicerequest sr ON sr.id = link.servicerequest_id
LEFT JOIN notes_organizationservice s ON s.id = sr.service_id
WHERE n.client_profile_id IS NOT NULL
"""

# The delete-correct answer. Aggregates straight from the through-tables, so a removed
# service stops being counted; the grain keeps it to hundreds of rows, and no client filter
# keeps the organisation totals complete.
CREATE_SERVICE_ROLLUP_VIEW = """
CREATE OR REPLACE VIEW analytics_service_rollup AS
SELECT
    x.organization_id,
    x.service_category,
    x.service_label,
    x.kind,
    count(*)                    AS link_count,
    count(DISTINCT x.client_id) AS client_count,
    count(DISTINCT x.note_id)   AS note_count,
    max(x.interacted_at)        AS last_interacted_at
FROM (
    SELECT
        n.organization_id,
        sc.name AS service_category,
        s.label AS service_label,
        'provided' AS kind,
        n.client_profile_id AS client_id,
        n.id AS note_id,
        n.interacted_at
    FROM notes_note_provided_services link
    JOIN notes_note n ON n.id = link.note_id
    JOIN notes_servicerequest sr ON sr.id = link.servicerequest_id
    LEFT JOIN notes_organizationservice s ON s.id = sr.service_id
    LEFT JOIN notes_organizationservicecategory sc ON sc.id = s.category_id

    UNION ALL

    SELECT
        n.organization_id,
        sc.name,
        s.label,
        'requested',
        n.client_profile_id,
        n.id,
        n.interacted_at
    FROM notes_note_requested_services link
    JOIN notes_note n ON n.id = link.note_id
    JOIN notes_servicerequest sr ON sr.id = link.servicerequest_id
    LEFT JOIN notes_organizationservice s ON s.id = sr.service_id
    LEFT JOIN notes_organizationservicecategory sc ON sc.id = s.category_id
) x
GROUP BY x.organization_id, x.service_category, x.service_label, x.kind
"""

# `is_overdue` requires `completed_on IS NULL`: a request that finished late was late,
# it is not still overdue. `analytics_client_summary` counts the same way.
CREATE_SERVICE_REQUEST_VIEW = """
CREATE OR REPLACE VIEW analytics_client_service_request AS
SELECT
    sr.client_profile_id AS client_id,
    sr.id                AS service_request_id,
    s.label              AS service_label,
    s.organization_id    AS service_organization_id,
    sr.status,
    sr.service_id IS NOT NULL AS has_service,
    sr.due_by IS NOT NULL     AS has_due_date,
    sr.due_by,
    sr.completed_on,
    (
        sr.due_by IS NOT NULL
        AND sr.due_by < now()
        AND sr.completed_on IS NULL
    ) AS is_overdue,
    sr.created_at,
    sr.updated_at
FROM notes_servicerequest sr
LEFT JOIN notes_organizationservice s ON s.id = sr.service_id
WHERE sr.client_profile_id IS NOT NULL
"""

CREATE_TASK_VIEW = """
CREATE OR REPLACE VIEW analytics_client_task AS
SELECT
    t.client_profile_id AS client_id,
    t.id                AS task_id,
    t.status,
    t.assignee_id IS NOT NULL AS is_assigned,
    nullif(btrim(t.summary), '')     IS NOT NULL AS has_summary,
    nullif(btrim(t.description), '') IS NOT NULL AS has_description,
    t.organization_id,
    t.team_id,
    t.team_id IS NOT NULL       AS has_team,
    t.note_id IS NOT NULL       AS has_note,
    t.created_by_id IS NOT NULL AS has_creator,
    t.created_at,
    t.updated_at
FROM tasks_task t
WHERE t.client_profile_id IS NOT NULL
"""

CREATE_DOCUMENT_VIEW = """
CREATE OR REPLACE VIEW analytics_client_document AS
SELECT
    a.object_id AS client_id,
    a.id        AS attachment_id,
    a.attachment_type,
    a.namespace,
    a.mime_type,
    a.upload_org_id,
    nullif(btrim(a.original_filename), '') IS NOT NULL AS has_original_filename,
    a.uploaded_by_id IS NOT NULL AS has_uploader,
    a.created_at,
    a.updated_at
FROM common_attachment a
JOIN django_content_type ct ON ct.id = a.content_type_id
WHERE ct.app_label = 'clients' AND ct.model = 'clientprofile'
"""

CREATE_REFERRAL_VIEW = """
CREATE OR REPLACE VIEW analytics_client_referral AS
SELECT
    r.client_profile_id AS client_id,
    r.id                AS referral_id,
    r.status,
    r.shelter_id,
    r.shelter_id IS NOT NULL    AS has_shelter,
    r.organization_id,
    nullif(btrim(r.notes), '') IS NOT NULL AS has_notes,
    r.created_by_id IS NOT NULL AS has_creator,
    r.created_at,
    r.updated_at
FROM referrals_referral r
WHERE r.client_profile_id IS NOT NULL
"""


class Migration(migrations.Migration):
    # `reports/0003` already pins clients, common, notes and tasks; only referrals is new
    # here, so it is the one dependency that is not already implied.
    dependencies = [
        ("reports", "0003_analytics_client_summary_view"),
        ("referrals", "0002_initial"),
    ]

    operations = [
        migrations.RunSQL(
            statement,
            f"DROP VIEW IF EXISTS {view};",
        )
        for view, statement in (
            ("analytics_client_interaction", CREATE_INTERACTION_VIEW),
            ("analytics_note_provided_service", CREATE_PROVIDED_SERVICE_VIEW),
            ("analytics_note_requested_service", CREATE_REQUESTED_SERVICE_VIEW),
            ("analytics_service_rollup", CREATE_SERVICE_ROLLUP_VIEW),
            ("analytics_client_service_request", CREATE_SERVICE_REQUEST_VIEW),
            ("analytics_client_task", CREATE_TASK_VIEW),
            ("analytics_client_document", CREATE_DOCUMENT_VIEW),
            ("analytics_client_referral", CREATE_REFERRAL_VIEW),
        )
    ]
