# Generated manually — data migration to backfill Team objects and copy old_team -> team FK

from django.db import migrations
from common.enums import SelahTeamEnum


def backfill_teams_and_copy(apps, schema_editor):
    """Create Team objects per org for each SelahTeamEnum value, then copy task.old_team -> task.team FK."""
    Task = apps.get_model("tasks", "Task")
    Team = apps.get_model("teams", "Team")
    Organization = apps.get_model("organizations", "Organization")

    # Collect all organizations that have tasks with old_team set
    org_ids = (
        Task.objects.exclude(old_team__isnull=True)
        .exclude(old_team="")
        .values_list("organization_id", flat=True)
        .distinct()
    )

    # For each org, ensure Team objects exist for all SelahTeamEnum values
    for org_id in org_ids:
        try:
            org = Organization.objects.get(pk=org_id)
        except Organization.DoesNotExist:
            continue

        for enum_member in SelahTeamEnum:
            Team.objects.get_or_create(
                organization=org,
                slug=enum_member.value,
                defaults={"name": enum_member.label},
            )

    # Copy old_team enum values -> team FK via slug matching
    for task in Task.objects.exclude(old_team__isnull=True).exclude(old_team="").iterator():
        try:
            team = Team.objects.get(
                organization_id=task.organization_id,
                slug=task.old_team,
            )
            task.team = team
            task.save(update_fields=["team"])
        except Team.DoesNotExist:
            # If no matching Team, leave team as null — will be handled manually
            pass


def reverse_backfill(apps, schema_editor):
    """Reverse: set team FK to null (old_team already preserves the original value)."""
    Task = apps.get_model("tasks", "Task")
    Task.objects.all().update(team=None)


class Migration(migrations.Migration):

    dependencies = [
        ("tasks", "0007_add_team_fk_and_triggers"),
        ("teams", "0001_initial"),
        ("organizations", "0006_alter_organization_slug"),
    ]

    operations = [
        migrations.RunPython(backfill_teams_and_copy, reverse_backfill),
    ]
