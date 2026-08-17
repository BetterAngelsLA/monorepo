"""Safety net for the SelahTeamEnum → Team backfill.

**This is not the original backfill.**  That shipped in #2151 (June 2026) as
``RunPython`` inside ``notes.0033`` and ``tasks.0006``, which created the
per-org ``Team`` rows and copied ``old_team`` into the ``team`` FK.  Those
files were later deleted by the migration squash in #2247 — after production
had already applied them — so the *data* migration happened and only the
*files* went away.  The squashed ``0001_initial`` / ``0002_initial`` carry
schema operations only.

So on any database that followed the normal path this migration finds nothing
to do: rows backfilled in June have ``team`` set and are filtered out.  It
exists for the cases that did not follow that path — a database restored from
a pre-#2151 dump, or an environment rebuilt from the squashed migrations while
holding legacy rows.

For every organization whose notes/tasks still carry a legacy ``old_team``
value without a ``team`` FK:

1. Create the missing ``Team`` row scoped to that organization.
2. Point the notes/tasks at it.

Idempotent — re-running is a no-op.  Safe to reverse (reverse is a no-op;
the generated Team rows are left in place).

Do NOT delete this migration once it has been applied anywhere: the
``old_team`` removals depend on it, and the historical models it reads
(``apps.get_model``) reflect the schema at this point in the graph, so it
keeps working after the columns are dropped.
"""

from django.db import migrations

# Slug → human-readable name for the deprecated ``SelahTeamEnum`` values.
# Hardcoded so the migration is self-contained (no app imports at runtime).
LEGACY_TEAM_LABELS = {
    "bowtie_riverside_outreach": "Bowtie & Riverside Outreach",
    "echo_park_on_site": "Echo Park On-site",
    "echo_park_outreach": "Echo Park Outreach",
    "hollywood_on_site": "Hollywood On-site",
    "hollywood_outreach": "Hollywood Outreach",
    "la_river_outreach": "LA River Outreach",
    "los_feliz_outreach": "Los Feliz Outreach",
    "northeast_hollywood_outreach": "Northeast Hollywood Outreach",
    "selah_staff": "SELAH Staff",
    "silver_lake_outreach": "Silver Lake Outreach",
    "slcc_on_site": "SLCC On-site",
    "sunday_social_atwater_on_site": "Sunday Social / Atwater On-site",
    "sunday_social_atwater_outreach": "Sunday Social / Atwater Outreach",
    "wdi_on_site": "WDI On-site",
    "wdi_outreach": "WDI Outreach",
}


def backfill_org_teams(apps, schema_editor):  # type: ignore[no-untyped-def]
    Team = apps.get_model("teams", "Team")
    Note = apps.get_model("notes", "Note")
    Task = apps.get_model("tasks", "Task")

    def ensure_team(org_id: int, slug: str):
        return Team.objects.get_or_create(
            slug=slug,
            organization_id=org_id,
            defaults={"name": LEGACY_TEAM_LABELS.get(slug, slug.replace("_", " ").title())},
        )[0]

    # Rows needing backfill: legacy team set, FK still empty.
    note_rows = list(
        Note.objects.filter(team__isnull=True, old_team__isnull=False)
        .values_list("organization_id", "old_team")
        .distinct()
    )
    task_rows = list(
        Task.objects.filter(organization__isnull=False, team__isnull=True, old_team__isnull=False)
        .values_list("organization_id", "old_team")
        .distinct()
    )

    for org_id, slug in set(note_rows + task_rows):
        ensure_team(org_id, slug)

    for org_id, slug in note_rows:
        team = ensure_team(org_id, slug)
        Note.objects.filter(organization_id=org_id, old_team=slug, team__isnull=True).update(team_id=team.pk)

    for org_id, slug in task_rows:
        team = ensure_team(org_id, slug)
        Task.objects.filter(organization_id=org_id, old_team=slug, team__isnull=True).update(team_id=team.pk)


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0001_initial"),
        ("notes", "0002_initial"),
        ("tasks", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(backfill_org_teams, migrations.RunPython.noop),
    ]
