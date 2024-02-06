# permissions.py

from enum import StrEnum


class NotePermissions(StrEnum):
    VIEW = "notes.view_note"
    CHANGE = "notes.change_note"
    DELETE = "notes.delete_note"
    ADD = "notes.add_note"


class PrivateNotePermissions(StrEnum):
    VIEW = "notes.view_private_note"
    CHANGE = "notes.change_private_note"
    DELETE = "notes.delete_private_note"
    ADD = "notes.add_private_note"
