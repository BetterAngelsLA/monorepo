import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Point ``Task.team`` at ``RESTRICT`` so a team in use cannot be deleted.

    See ``notes.0004_alter_note_team`` -- ``on_delete`` has no database
    representation, so re-creating the identical foreign key would lock
    ``tasks_task`` to prove nothing.
    """

    dependencies = [
        ("tasks", "0004_alter_task_created_by_alter_task_organization_and_more"),
        ("teams", "0003_remove_team_unique_team_slug_per_org_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="task",
                    name="team",
                    field=models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.RESTRICT,
                        to="teams.team",
                    ),
                ),
            ],
            database_operations=[],
        ),
    ]
