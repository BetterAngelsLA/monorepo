"""Tests for ``common.graphql.utils``."""

from types import SimpleNamespace
from typing import Any

from common.graphql.utils import permissioned_qs
from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from notes.models import Note
from tasks.models import Task


class PermissionedQsTestCase(SimpleTestCase):
    """``permissioned_qs`` is the only reader of the queryset the extension injects."""

    @staticmethod
    def _info(**context: Any) -> Any:
        return SimpleNamespace(context=SimpleNamespace(**context))

    def test_returns_the_queryset_the_extension_prepared(self) -> None:
        qs = Note.objects.all()

        self.assertIs(permissioned_qs(self._info(qs=qs), Note), qs)

    def test_rejects_a_queryset_for_another_model(self) -> None:
        """The mismatch an annotation cannot catch: the extension names Note,
        the resolver expects Task, and every lookup silently misses."""
        with self.assertRaises(ImproperlyConfigured):
            permissioned_qs(self._info(qs=Note.objects.all()), Task)

    def test_a_missing_extension_raises_attribute_error(self) -> None:
        with self.assertRaises(AttributeError):
            permissioned_qs(self._info(), Note)
