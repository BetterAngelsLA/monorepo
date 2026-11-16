"""Detach any team belonging to an organization other than the record's own.

Such a row cannot be saved again: ``Task.clean()`` rejects the pair, so
every later edit fails validation on a field the editor did not touch.  Expected
to affect nothing -- the rule has been enforced in application code since #2339
-- but it logs what it touches, because this cannot be undone and a silent count
of zero is indistinguishable from a silent count of many.
"""

import logging

from django.db import migrations
from django.db.models import F

logger = logging.getLogger(__name__)


def null_cross_org_teams(apps, schema_editor):  # type: ignore[no-untyped-def]
    Task = apps.get_model("tasks", "Task")

    offending = (
        Task.objects.using(schema_editor.connection.alias)
        .filter(team__isnull=False)
        .exclude(team__organization_id=F("organization_id"))
    )
    detached = list(offending.values_list("pk", "team_id"))

    if not detached:
        return

    logger.warning(
        "Detaching %s cross-organization team reference(s) from tasks.Task: %s",
        len(detached),
        ", ".join(f"pk={pk} team_id={team_id}" for pk, team_id in detached),
    )
    offending.update(team=None)


class Migration(migrations.Migration):
    dependencies = [
        ("tasks", "0005_alter_task_team"),
    ]

    operations = [
        migrations.RunPython(null_cross_org_teams, migrations.RunPython.noop),
    ]
