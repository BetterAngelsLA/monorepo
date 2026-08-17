"""Audit command — verify teams never cross organization boundaries.

Run before/after the team backfill migration as part of the org-scoping
deployment runbook::

    manage.py audit_team_org_scoping

Exits non-zero when cross-org team references are found.
"""

from django.core.management.base import BaseCommand
from django.db.models import Count, F


class Command(BaseCommand):
    help = "Audit org-scoped team data (team counts per org, cross-org team references)."

    def handle(self, *args, **options):  # type: ignore[no-untyped-def]
        from notes.models import Note
        from tasks.models import Task
        from teams.models import Team

        cross_org_notes = Note.objects.filter(team__isnull=False).exclude(team__organization_id=F("organization_id"))
        cross_org_tasks = Task.objects.filter(team__isnull=False).exclude(team__organization_id=F("organization_id"))

        self.stdout.write(f"Teams total: {Team.objects.count()}")
        self.stdout.write("Teams per org:")
        for row in Team.objects.values("organization_id", "organization__name").annotate(n=Count("id")):
            self.stdout.write(f"  org {row['organization_id']} ({row['organization__name']}): {row['n']}")

        self.stdout.write(f"Cross-org notes: {cross_org_notes.count()}")
        for note in cross_org_notes.values("id", "organization_id", "team_id", "team__organization_id"):
            self.stdout.write(
                f"  note {note['id']}: org {note['organization_id']} -> team in org {note['team__organization_id']}"
            )
        self.stdout.write(f"Cross-org tasks: {cross_org_tasks.count()}")
        for task in cross_org_tasks.values("id", "organization_id", "team_id", "team__organization_id"):
            self.stdout.write(
                f"  task {task['id']}: org {task['organization_id']} -> team in org {task['team__organization_id']}"
            )

        if cross_org_notes.exists() or cross_org_tasks.exists():
            self.stderr.write("FAIL: cross-org team references found.")
            raise SystemExit(1)

        self.stdout.write("OK: no cross-org team references.")
