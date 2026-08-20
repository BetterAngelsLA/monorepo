"""Give the composite foreign keys on ``Note.team`` and ``Task.team`` a target.

A composite FK must reference a unique constraint on exactly the columns it
names, so ``(id, organization_id)`` needs one of its own even though ``id`` is
already unique by itself.

Deliberately *not* declared in ``Team.Meta.constraints``: Django would then
validate it on every ``full_clean()``, costing a query that can only ever
confirm what the primary key already guarantees -- and on a create, one that
asks whether ``id = NULL`` is taken. Nothing in Python needs to know about it.
"""

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("teams", "0003_remove_team_unique_team_slug_per_org_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql=(
                'ALTER TABLE "teams_team" ADD CONSTRAINT "unique_team_id_per_org" '
                'UNIQUE ("id", "organization_id")'
            ),
            reverse_sql='ALTER TABLE "teams_team" DROP CONSTRAINT "unique_team_id_per_org"',
        ),
    ]
