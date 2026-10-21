"""Reject ``manage.py test``: the backend suite is pytest-only."""

from typing import Any

from django.core.management.base import CommandError
from django.core.management.commands.test import Command as DjangoTestCommand


class Command(DjangoTestCommand):
    """Fail loudly instead of running the unittest subset without conftest."""

    def handle(self, *test_labels: Any, **options: Any) -> None:
        raise CommandError(
            "The backend test suite runs under pytest. Use `uv run pytest` (or `yarn nx test betterangels-backend`)."
        )
