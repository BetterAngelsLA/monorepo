"""Tests for exporting interaction data via NoteResource."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone
from model_bakery import baker
from notes.admin import NoteResource
from notes.models import Note
from reports.exporters import ReportNoteResource


class TestNoteResourceExport:
    """Tests for exporting notes via NoteResource (django-import-export)."""

    @pytest.mark.django_db
    def test_export_empty_queryset(self) -> None:
        """Test exporting an empty queryset."""
        resource = NoteResource()
        dataset = resource.export(queryset=Note.objects.none())
        csv_content = dataset.csv

        # Should have headers but no data rows
        lines = csv_content.strip().split("\n")
        assert len(lines) >= 1  # At least headers
        assert "Client ID" in lines[0] or "client_id" in lines[0].lower()

    @pytest.mark.django_db
    def test_export_single_note(self) -> None:
        """Test exporting a single note."""
        note = baker.make(Note)

        resource = NoteResource()
        dataset = resource.export(queryset=Note.objects.filter(pk=note.pk))
        csv_content = dataset.csv

        # Should have headers + 1 data row
        lines = csv_content.strip().split("\n")
        assert len(lines) >= 2

    @pytest.mark.django_db
    def test_export_multiple_notes(self) -> None:
        """Test exporting multiple notes."""
        notes = baker.make(Note, _quantity=5)

        resource = NoteResource()
        dataset = resource.export(queryset=Note.objects.filter(pk__in=[n.pk for n in notes]))
        csv_content = dataset.csv

        # Should have headers + 5 data rows
        lines = csv_content.strip().split("\n")
        assert len(lines) >= 6

    @pytest.mark.django_db
    def test_export_csv_format(self) -> None:
        """Test that exported CSV has correct format."""
        note = baker.make(Note)

        resource = NoteResource()
        dataset = resource.export(queryset=Note.objects.filter(pk=note.pk))
        csv_content = dataset.csv

        # Check that it's valid CSV (has commas)
        assert "," in csv_content

        # Check that it has multiple lines (header + data)
        lines = csv_content.strip().split("\n")
        assert len(lines) >= 2

    def test_note_resource_from_django_import_export(self) -> None:
        """Test that NoteResource is from django-import-export."""
        from import_export.resources import ModelResource

        # NoteResource should be a subclass of ModelResource
        assert issubclass(NoteResource, ModelResource)


@pytest.mark.django_db
class TestExportTimeZones:
    """The admin export follows the person browsing; a report export does not."""

    # 2025-02-01 05:30 UTC is 2025-01-31 21:30 in Los Angeles but 2025-02-01 00:30
    # in New York, so the two zones disagree about which day this note belongs to.
    INSTANT = datetime(2025, 2, 1, 5, 30, tzinfo=UTC)

    def test_admin_export_follows_the_active_timezone(self) -> None:
        """TimezoneMiddleware activates the browsing user's zone, and the admin export uses it."""
        note = baker.make(Note, interacted_at=self.INSTANT)

        with timezone.override(ZoneInfo("America/New_York")):
            csv_content = NoteResource().export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "02/01/2025" in csv_content

    def test_report_export_is_labelled_on_the_operating_zone(self) -> None:
        """A report is a record, so its rows carry the calendar its range was cut on.

        Following whoever triggered it would let the same month export as two
        different files, and neither would match the emailed copy.
        """
        note = baker.make(Note, interacted_at=self.INSTANT)

        with timezone.override(ZoneInfo("America/New_York")):
            csv_content = ReportNoteResource().export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "01/31/2025" in csv_content
        assert "02/01/2025" not in csv_content
