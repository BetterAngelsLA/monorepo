import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    """Point ``Note.team`` at ``RESTRICT`` so a team in use cannot be deleted.

    ``on_delete`` is enforced by Django's deletion collector, not by the database:
    both ``SET_NULL`` and ``RESTRICT`` compile to a plain foreign key with no
    ``ON DELETE`` clause.  A plain ``AlterField`` would still drop and re-add that
    identical constraint, and re-adding it validates every row in ``notes_note`` --
    one of the two largest tables -- under a lock, for no schema change.  So the
    database half is deliberately empty.
    """

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
