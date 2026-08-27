import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """A plain ``AlterField`` would drop and re-add an identical FK constraint; skip the SQL."""

    dependencies = [
        ("notes", "0003_remove_note_note_add_insert_and_more"),
        ("teams", "0003_remove_team_unique_team_slug_per_org_and_more"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name="note",
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
