# permissions.py

from enum import StrEnum


class SimpleModelPermissions(StrEnum):
    VIEW = "simplemodels.view_note"
    CHANGE = "simplemodels.change_note"
    DELETE = "simplemodels.delete_note"
    ADD = "simplemodels.add_note"
