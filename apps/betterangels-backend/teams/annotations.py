"""Reusable annotations for Team querysets."""

import functools
import operator
from typing import cast

from django.db.models import Exists, Model, OuterRef, Value
from django.db.models.deletion import PROTECT, RESTRICT
from django.db.models.expressions import Combinable

from .models import Team


def _restricting_relations() -> list[tuple[type[Model], str]]:
    """Every relation whose ``on_delete`` refuses a team's deletion, as (model, field name)."""
    return [
        (cast(type[Model], rel.related_model), rel.field.name)
        for rel in Team._meta.related_objects
        if getattr(rel, "on_delete", None) in (PROTECT, RESTRICT)
    ]


def annotate_is_in_use() -> Combinable:
    """Whether a team's deletion would be refused."""
    held_by = [
        Exists(model._base_manager.filter(**{field: OuterRef("pk")})) for model, field in _restricting_relations()
    ]

    return functools.reduce(operator.or_, held_by, Value(False))
