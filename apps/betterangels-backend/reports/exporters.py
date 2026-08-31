"""Export resources for reports.

The admin's :class:`~notes.admin.NoteResource` labels rows in the timezone the
person browsing has active, which is what someone downloading from the admin
wants.  A report is a record rather than a view: its rows are labelled on the
same calendar its date range was cut on, so the file reconciles no matter who
ran it or whether anyone did.
"""

from typing import Optional

from common.constants import OPERATING_TIME_ZONE
from notes.admin import NoteResource
from notes.models import Note


class ReportNoteResource(NoteResource):
    """Notes exported for a scheduled or downloaded report."""

    def dehydrate_interacted_at(self, note: Note) -> Optional[str]:
        if not note.interacted_at:
            return None
        return note.interacted_at.astimezone(OPERATING_TIME_ZONE).strftime("%m/%d/%Y")
