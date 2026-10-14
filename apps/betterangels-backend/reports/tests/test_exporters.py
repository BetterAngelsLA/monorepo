"""Tests for exporting interaction data via NoteResource."""

import csv
import io
from datetime import UTC, datetime
from zoneinfo import ZoneInfo

import pytest
from django.utils import timezone
from model_bakery import baker

from notes.admin import NoteResource
from notes.models import Note
from test_utils.timezones import SITE_TIME_ZONE, SITE_TZ


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
    """Rows are dated on the site's calendar, whatever zone the request activated.

    A row label has to agree with the range that selected the row.  If it followed
    the activated zone it could disagree with it — and with the same period's
    scheduled email, which has no viewer at all.

    Note that the calendar is now a property of the resource, so a test that wants
    a different one passes it in.  ``timezone.override`` would not do it: it moves
    the *active* zone, and ``get_default_timezone`` — which the resource reads —
    deliberately does not follow it.
    """

    # 2025-02-01 05:30 UTC is 2025-01-31 21:30 in Los Angeles but 2025-02-01 00:30
    # in New York, so the two zones disagree about which day this note belongs to.
    INSTANT = datetime(2025, 2, 1, 5, 30, tzinfo=UTC)

    def test_export_ignores_the_activated_timezone(self) -> None:
        """An activated zone — a browsing admin's — cannot relabel the rows."""
        note = baker.make(Note, interacted_at=self.INSTANT)

        with timezone.override(ZoneInfo("America/New_York")):
            csv_content = NoteResource(time_zone=SITE_TZ).export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "01/31/2025" in csv_content
        assert "02/01/2025" not in csv_content

    def test_export_falls_back_to_the_site_timezone(self) -> None:
        """A caller that names no calendar gets ``settings.TIME_ZONE``."""
        note = baker.make(Note, interacted_at=self.INSTANT)

        csv_content = NoteResource().export(queryset=Note.objects.filter(pk=note.pk)).csv

        assert "01/31/2025" in csv_content
        assert "02/01/2025" not in csv_content


@pytest.mark.django_db
class TestExportedCalendarIsVerifiable:
    """The file names the calendar its dates are written on.

    ``Interacted At`` asserts a calendar without saying which one.  Without these
    columns a consumer parsing ``01/31/2025`` has no way to check whether that is
    the day it thinks it is — and no way to derive a different one, because the
    date carries no time to convert.
    """

    # 2025-02-01 05:30 UTC: 31 January in Los Angeles, 1 February in Tokyo.
    INSTANT = datetime(2025, 2, 1, 5, 30, tzinfo=UTC)

    def _rows(self, time_zone: ZoneInfo) -> list[dict[str, str]]:
        note = baker.make(Note, interacted_at=self.INSTANT)
        csv_content = NoteResource(time_zone=time_zone).export(queryset=Note.objects.filter(pk=note.pk)).csv
        return list(csv.DictReader(io.StringIO(csv_content)))

    def test_the_new_columns_are_appended_after_the_existing_ones(self) -> None:
        """Adding a column must not move one an existing consumer reads."""
        note = baker.make(Note, interacted_at=self.INSTANT)
        csv_content = NoteResource(time_zone=SITE_TZ).export(queryset=Note.objects.filter(pk=note.pk)).csv
        headers = next(csv.reader(io.StringIO(csv_content)))

        assert headers[:2] == ["Client ID", "Interacted At"]
        assert headers[-2:] == ["Interacted At (UTC)", "Interacted At Time Zone"]
        assert headers[2:10] == [
            "Purpose",
            "Provided Services",
            "Requested Services",
            "Volunteer",
            "Location",
            "Team",
            "Organization",
            "Notes",
        ]

    def test_the_named_zone_matches_the_day_the_row_was_labeled_with(self) -> None:
        """The zone column names the calendar the label is actually written on."""
        row = self._rows(SITE_TZ)[0]

        assert row["Interacted At Time Zone"] == SITE_TIME_ZONE
        assert row["Interacted At"] == "01/31/2025"
        # The same instant, read a calendar further east, really is February's —
        # so the label above is only correct because the zone says which one it is.
        assert self._rows(ZoneInfo("Asia/Tokyo"))[0]["Interacted At"] == "02/01/2025"

    def test_the_utc_column_reproduces_the_labeled_day(self) -> None:
        """Invariant between the two renderings of one instant.

        Two dehydrate methods produce these columns, so nothing structurally stops
        them disagreeing.  This asserts the property a consumer relies on: convert
        the instant to the named zone and you get the day in ``Interacted At``.
        """
        row = self._rows(SITE_TZ)[0]

        assert row["Interacted At (UTC)"] == "2025-02-01T05:30:00Z"
        instant = datetime.strptime(row["Interacted At (UTC)"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=UTC)
        re_derived = instant.astimezone(ZoneInfo(row["Interacted At Time Zone"])).strftime("%m/%d/%Y")

        assert re_derived == row["Interacted At"]
