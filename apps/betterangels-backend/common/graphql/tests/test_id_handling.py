"""An id is whatever the column says it is -- never assumed to be an integer."""

import uuid

from common.graphql.types import _matchable_values
from django.test import TestCase
from notes.models import Note, NoteImportRecord


class MatchableValuesTestCase(TestCase):
    """``ID`` accepts any string, and only the field knows which ones can match."""

    def test_keeps_values_an_integer_column_can_hold(self) -> None:
        self.assertEqual(_matchable_values(Note, "team", ["1", "2"]), ["1", "2"])

    def test_drops_values_an_integer_column_cannot_hold(self) -> None:
        self.assertEqual(_matchable_values(Note, "team", ["1", "abc"]), ["1"])

    def test_keeps_a_well_formed_uuid_for_a_uuid_column(self) -> None:
        """The reason nothing here converts to int.

        ``NoteImportRecord.import_job`` points at a UUID primary key. Asking the
        field rather than calling ``int()`` is what makes this work unchanged.
        """
        job_id = str(uuid.uuid4())

        self.assertEqual(_matchable_values(NoteImportRecord, "import_job", [job_id]), [job_id])

    def test_drops_a_malformed_uuid_for_a_uuid_column(self) -> None:
        job_id = str(uuid.uuid4())

        self.assertEqual(_matchable_values(NoteImportRecord, "import_job", [job_id, "abc"]), [job_id])
