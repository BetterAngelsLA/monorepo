"""Database constraints Django does not ship a class for.

``BaseConstraint`` is Django's documented extension point -- see
``django.contrib.postgres.constraints.ExclusionConstraint`` for its own worked
example.  django-stubs narrows the three SQL hooks to ``str`` and their arguments
to optionals, while Django passes a model and a schema editor and accepts the
``Statement`` that ``ExclusionConstraint`` also returns, so those overrides are
reported and ignored individually below.
"""

from collections.abc import Sequence
from typing import Any, Optional, cast

from django.db import DEFAULT_DB_ALIAS
from django.db.backends.base.schema import BaseDatabaseSchemaEditor
from django.db.backends.ddl_references import Columns, Statement, Table
from django.db.models import BaseConstraint, Deferrable, Field, Model


class CompositeForeignKey(BaseConstraint):
    """A foreign key over more than one column.

    Django models a foreign key as a field, and a field is one column, so a rule
    tying two columns to the same parent row has nothing to hang off.  Declaring
    it here rather than in ``RunSQL`` is what puts it in the migration state, so
    ``makemigrations`` writes it and ``makemigrations --check`` sees it drift.

    *to_model* is an ``"app_label.ModelName"`` label rather than a class, so the
    constraint stays serializable and resolves against the historical app
    registry when a migration applies it.

    The referenced columns need a unique constraint of their own --
    ``unique_team_id_per_org`` on ``Team`` is the one this exists for.
    """

    template = "CONSTRAINT %(name)s FOREIGN KEY (%(columns)s) REFERENCES %(to_table)s (%(to_columns)s)%(deferrable)s"

    def __init__(
        self,
        *,
        name: str,
        fields: Sequence[str],
        to_model: str,
        to_fields: Sequence[str],
        deferrable: Optional[Deferrable] = None,
        violation_error_code: Optional[str] = None,
        violation_error_message: Optional[str] = None,
    ) -> None:
        if len(fields) != len(to_fields):
            raise ValueError("fields and to_fields must name the same number of columns.")

        self.fields = tuple(fields)
        self.to_model = to_model
        self.to_fields = tuple(to_fields)
        self.deferrable = deferrable
        super().__init__(
            name=name,
            violation_error_code=violation_error_code,
            violation_error_message=violation_error_message,
        )

    def _columns(self, model: type[Model], fields: Sequence[str], schema_editor: BaseDatabaseSchemaEditor) -> Columns:
        columns = [cast(Field, model._meta.get_field(field)).column for field in fields]

        return Columns(model._meta.db_table, cast(list[str], columns), schema_editor.quote_name)

    def constraint_sql(  # type: ignore[override]
        self, model: type[Model], schema_editor: BaseDatabaseSchemaEditor
    ) -> Statement:
        target = model._meta.apps.get_model(self.to_model)

        return Statement(
            self.template,
            name=schema_editor.quote_name(self.name),
            columns=self._columns(model, self.fields, schema_editor),
            to_table=Table(target._meta.db_table, schema_editor.quote_name),
            to_columns=self._columns(target, self.to_fields, schema_editor),
            deferrable=schema_editor._deferrable_constraint_sql(self.deferrable),  # type: ignore[attr-defined]
        )

    def create_sql(  # type: ignore[override]
        self, model: type[Model], schema_editor: BaseDatabaseSchemaEditor
    ) -> Statement:
        return Statement(
            "ALTER TABLE %(table)s ADD %(constraint)s",
            table=Table(model._meta.db_table, schema_editor.quote_name),
            constraint=self.constraint_sql(model, schema_editor),
        )

    def remove_sql(  # type: ignore[override]
        self, model: type[Model], schema_editor: BaseDatabaseSchemaEditor
    ) -> Statement:
        return cast(
            Statement,
            schema_editor._delete_constraint_sql(  # type: ignore[attr-defined]
                schema_editor.sql_delete_fk,
                model,
                schema_editor.quote_name(self.name),
            ),
        )

    def validate(
        self,
        model: type[Model],
        instance: Model,
        exclude: Optional[set[str]] = None,
        using: str = DEFAULT_DB_ALIAS,
    ) -> None:
        """The database enforces this one.

        It cannot simply be left off: ``BaseConstraint.validate`` raises
        ``NotImplementedError`` and ``Model.validate_constraints`` catches only
        ``ValidationError``.  Checking it here would repeat the query
        ``teams.validators.validate_team_in_org`` already makes from
        ``Note.clean()`` / ``Task.clean()``, which reports the violation against
        the ``team`` field rather than as a non-field error.
        """

    def deconstruct(self) -> tuple[str, Sequence[Any], dict[str, Any]]:
        path, args, kwargs = super().deconstruct()
        kwargs["fields"] = self.fields
        kwargs["to_model"] = self.to_model
        kwargs["to_fields"] = self.to_fields

        if self.deferrable:
            kwargs["deferrable"] = self.deferrable

        return path, args, kwargs

    def __eq__(self, other: object) -> bool:
        # Without this the autodetector falls back to identity, concludes the
        # constraint was removed and re-added, and does so on every run.
        if isinstance(other, self.__class__):
            return (
                self.name == other.name
                and self.fields == other.fields
                and self.to_model == other.to_model
                and self.to_fields == other.to_fields
                and self.deferrable == other.deferrable
                and self.violation_error_code == other.violation_error_code
                and self.violation_error_message == other.violation_error_message
            )

        return super().__eq__(other)

    def __repr__(self) -> str:
        return "<%s: fields=%r to_model=%r to_fields=%r name=%r%s>" % (
            self.__class__.__qualname__,
            self.fields,
            self.to_model,
            self.to_fields,
            self.name,
            "" if self.deferrable is None else " deferrable=%r" % self.deferrable,
        )
