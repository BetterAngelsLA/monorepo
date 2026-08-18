"""Make ``name`` the only team identifier and drop ``slug``.

``slug`` dates from the ``SelahTeamEnum`` era, where it was the machine-readable
key the enum values mapped onto.  Notes and tasks now reference teams by ``id``,
so its only remaining job was uniqueness — which belongs on ``name``, the thing
users actually see and type.

Uniqueness moves to a case-insensitive constraint on ``(lower(name),
organization)``.  Existing rows may not satisfy it: the previous constraint was
on ``slug``, and the Django admin exposes ``slug`` as an editable field, so an
organization could hold both "Hollywood Outreach" and "hollywood outreach" with
different slugs.  The data step below resolves any such collision (and any blank
name) before the constraint is added, so this cannot fail on real data.
"""

import django.db.models.functions.text
import teams.validators
from django.db import migrations, models
from django.db.models.functions import Lower


def dedupe_team_names(apps, schema_editor):  # type: ignore[no-untyped-def]
    """Give every team a non-blank name that is unique per org, ignoring case."""
    Team = apps.get_model("teams", "Team")

    # Blank names cannot be told apart, so give them a stable placeholder first.
    for team in Team.objects.filter(name="").order_by("pk").iterator():
        team.name = f"Team {team.pk}"
        team.save(update_fields=["name"])

    duplicated = (
        Team.objects.values("organization_id", lowered=Lower("name"))
        .annotate(n=models.Count("id"))
        .filter(n__gt=1)
    )

    for row in duplicated:
        # Oldest keeps the name; the rest get a numeric suffix.
        clashing = list(
            Team.objects.filter(organization_id=row["organization_id"], name__iexact=row["lowered"]).order_by("pk")
        )
        for index, team in enumerate(clashing[1:], start=2):
            candidate = f"{team.name} ({index})"
            while Team.objects.filter(organization_id=team.organization_id, name__iexact=candidate).exists():
                index += 1
                candidate = f"{team.name} ({index})"
            team.name = candidate
            team.save(update_fields=["name"])


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0006_alter_organization_slug"),
        ("teams", "0002_team_is_active"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="team",
            name="unique_team_slug_per_org",
        ),
        # Must run before the new constraint is added.  Reverse is a no-op:
        # renames are not worth undoing, and the old constraint tolerates them.
        migrations.RunPython(dedupe_team_names, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="team",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("name"),
                models.F("organization"),
                name="unique_team_name_per_org",
            ),
        ),
        migrations.RemoveField(
            model_name="team",
            name="slug",
        ),
        # State only -- validators are not enforced by the database.
        migrations.AlterField(
            model_name="team",
            name="name",
            field=models.CharField(max_length=255, validators=[teams.validators.validate_has_alphanumeric]),
        ),
    ]
