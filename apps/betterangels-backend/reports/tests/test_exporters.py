"""Tests for exporting interaction data via NoteResource."""

from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone
from pytest_django.fixtures import SettingsWrapper
from model_bakery import baker
from notes.admin import NoteResource
from notes.models import Note


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
    """Rows are dated on whichever calendar is active when the export runs."""

    # 2025-02-01 05:30 UTC is 2025-01-31 21:30 in Los Angeles but 2025-02-01 00:30
    # in New York, so the two zones disagree about which day this note belongs to.
    INSTANT = datetime(2025, 2, 1, 5, 30, tzinfo=UTC)

    def test_export_follows_the_activated_timezone(self) -> None:
        """TimezoneMiddleware activates the browsing user's zone, and the export uses it."""
        note = baker.make(Note, interacted_at=self.INSTANT)

        with timezone.override(ZoneInfo("America/New_York")):
            csv_content = NoteResource().export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "02/01/2025" in csv_content
        assert "01/31/2025" not in csv_content

    def test_export_falls_back_to_the_site_timezone(self, settings: SettingsWrapper) -> None:
        """A Celery run activates no zone, so its rows are dated on ``settings.TIME_ZONE``."""
        settings.TIME_ZONE = "America/Los_Angeles"
        note = baker.make(Note, interacted_at=self.INSTANT)

        csv_content = NoteResource().export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "01/31/2025" in csv_content
        assert "02/01/2025" not in csv_content
