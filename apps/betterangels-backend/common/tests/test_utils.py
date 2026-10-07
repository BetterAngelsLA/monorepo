import uuid

from common.files.utils import canonicalise_filename
from common.utils import can_match, matchable_values
from django.test import TestCase
from notes.models import Note, NoteImportRecord
from unittest_parametrize import ParametrizedTestCase, parametrize


class CommonUtilsTestCase(ParametrizedTestCase, TestCase):
    @parametrize(
        "mime_type, filename, expected_filename",
        [
            ("application/pdf", "doc", "doc.pdf"),
            ("application/pdf", "doc.PDF", "doc.PDF"),
            ("application/pdf", "doc.TXT", "doc.pdf"),
            ("application/pdf", "doc.foo", "doc.foo.pdf"),
            ("image/jpeg", "what%E2%80%99s%20this", "what’s this.jpg"),
            ("image/jpeg", "image.jpeg", "image.jpeg"),
            ("image/jpeg", "image.jpg", "image.jpg"),
            ("image/heic", "image", "image.heic"),
            ("video/mpeg", "video", "video.mpeg"),
            ("video/mpeg", "video.mpg", "video.mpg"),
            ("video/mpeg", "video.mpeg", "video.mpeg"),
            ("invalid_mime_type", "image.jpg", None),
        ],
    )
    def test_get_filename_with_extension(self, mime_type: str, filename: str, expected_filename: str | None) -> None:
        if expected_filename:
            self.assertEqual(canonicalise_filename(mime_type, filename), expected_filename)
        else:
            with self.assertRaises(ValueError):
                canonicalise_filename(mime_type, filename)


class MatchableValuesTestCase(TestCase):
    """An id is whatever the column says it is -- never assumed to be an integer."""

    def test_keeps_values_an_integer_column_can_hold(self) -> None:
        field = Note._meta.get_field("team")

        self.assertEqual(matchable_values(field=field, values=["1", "2"]), ["1", "2"])

    def test_drops_values_an_integer_column_cannot_hold(self) -> None:
        field = Note._meta.get_field("team")

        self.assertEqual(matchable_values(field=field, values=["1", "abc"]), ["1"])

    def test_keeps_a_well_formed_uuid_for_a_uuid_column(self) -> None:
        field = NoteImportRecord._meta.get_field("import_job")
        job_id = str(uuid.uuid4())

        self.assertEqual(matchable_values(field=field, values=[job_id]), [job_id])

    def test_drops_a_malformed_uuid_for_a_uuid_column(self) -> None:
        field = NoteImportRecord._meta.get_field("import_job")
        job_id = str(uuid.uuid4())

        self.assertEqual(matchable_values(field=field, values=[job_id, "abc"]), [job_id])

    def test_can_match_answers_for_a_single_value(self) -> None:
        field = Note._meta.get_field("team")

        self.assertTrue(can_match(field=field, value="1"))
        self.assertFalse(can_match(field=field, value="abc"))
