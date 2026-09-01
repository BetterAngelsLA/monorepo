"""Properties ``CompositeForeignKey`` has to hold for migrations to be stable."""

from common.constraints import CompositeForeignKey
from django.db import connection
from django.db.models import Deferrable
from django.test import TestCase
from notes.models import Note


def build_constraint() -> CompositeForeignKey:
    return CompositeForeignKey(
        name="notes_note_team_same_org_fk",
        fields=["team", "organization"],
        to_model="teams.Team",
        to_fields=["id", "organization"],
        deferrable=Deferrable.DEFERRED,
    )


class CompositeForeignKeyTestCase(TestCase):
    def test_a_clone_compares_equal_to_the_original(self) -> None:
        """The migration autodetector compares a clone against the original.

        ``ProjectState`` stores ``constraint.clone()``, and
        ``create_altered_constraints`` decides whether anything changed with
        ``in``, which is ``==``.  Without ``__eq__`` that falls back to
        identity, so every ``makemigrations`` run would emit a
        ``RemoveConstraint``/``AddConstraint`` pair and ``--check`` would never
        be clean.
        """
        constraint = build_constraint()

        self.assertEqual(constraint.clone(), constraint)

    def test_deconstruct_names_every_argument_needed_to_rebuild_it(self) -> None:
        """``Options._format_names`` clones at model-definition time.

        Any keyword ``deconstruct()`` returns that ``__init__`` does not accept
        is a ``TypeError`` on import rather than a migration failure.
        """
        _, args, kwargs = build_constraint().deconstruct()

        self.assertEqual(CompositeForeignKey(*args, **kwargs), build_constraint())

    def test_a_differing_constraint_does_not_compare_equal(self) -> None:
        other = CompositeForeignKey(
            name="notes_note_team_same_org_fk",
            fields=["team", "organization"],
            to_model="teams.Team",
            to_fields=["id", "organization"],
        )

        self.assertNotEqual(other, build_constraint())

    def test_the_sql_names_both_columns_and_the_referenced_table(self) -> None:
        with connection.schema_editor(collect_sql=True) as schema_editor:
            sql = str(build_constraint().create_sql(Note, schema_editor))

        self.assertEqual(
            sql,
            'ALTER TABLE "notes_note" ADD CONSTRAINT "notes_note_team_same_org_fk" '
            'FOREIGN KEY ("team_id", "organization_id") '
            'REFERENCES "teams_team" ("id", "organization_id") '
            "DEFERRABLE INITIALLY DEFERRED",
        )

    def test_column_counts_that_cannot_line_up_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            CompositeForeignKey(
                name="mismatched",
                fields=["team", "organization"],
                to_model="teams.Team",
                to_fields=["id"],
            )
