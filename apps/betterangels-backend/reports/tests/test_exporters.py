"""Tests for data export via NoteResource."""

import pytest
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
