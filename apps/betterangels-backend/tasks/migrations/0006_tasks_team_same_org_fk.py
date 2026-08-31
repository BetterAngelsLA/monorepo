"""Make a cross-organization team reference impossible to store.

``Task.team`` is an ordinary FK to ``teams.Team``, so nothing at the storage
layer stopped it pointing at a team owned by a different organization.  The
service layer validates it and ``Task.clean()`` covers the Django admin, but
neither covers ``.update()``, ``bulk_update``, raw SQL, or a future caller that
forgets.

A *composite* foreign key on ``(team_id, organization_id)`` referencing
``teams_team(id, organization_id)`` makes the invariant structural: Postgres
rejects the row.  Under the default MATCH SIMPLE semantics the constraint is
satisfied whenever either column is NULL, so teamless tasks — and org-less
tasks, whose ``organization`` is SET_NULL — are unaffected.

No ON DELETE clause: ``Task.team`` is ``on_delete=RESTRICT``, so a team a task
references cannot be deleted at all.  Specifying ON DELETE SET NULL here would
null ``organization_id`` as well.
Deferred so intra-transaction ordering cannot trip it.
"""

from django.db import migrations
from django.db.models import F


def null_cross_org_teams(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Detach any team belonging to another organization.

    Must run before the constraint is added, or adding it fails on the offending
    rows.  Expected to affect nothing.
    """
    Task = apps.get_model("tasks", "Task")

    (Task.objects.filter(team__isnull=False).exclude(team__organization_id=F("organization_id")).update(team=None))


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0005_alter_task_team"),
        ("teams", "0004_team_unique_team_id_per_org_and_more"),
    ]

    operations = [
        migrations.RunPython(null_cross_org_teams, migrations.RunPython.noop),
        migrations.RunSQL(
            sql=(
                'ALTER TABLE "tasks_task" ADD CONSTRAINT "tasks_task_team_same_org_fk" '
                'FOREIGN KEY ("team_id", "organization_id") '
                'REFERENCES "teams_team" ("id", "organization_id") '
                "DEFERRABLE INITIALLY DEFERRED"
            ),
            reverse_sql='ALTER TABLE "tasks_task" DROP CONSTRAINT "tasks_task_team_same_org_fk"',
        ),
    ]
