"""
This type stub file was generated by pyright.
"""

import enum
import sys
from typing import Any

"""
This type stub file was generated by pyright.
"""
if sys.version_info >= (3, 11):
    enum_property = enum.property
else:
    ...
class ChoicesMeta(enum.EnumMeta):
    names: list[str]
    choices: list[tuple[Any, str]]
    labels: list[str]
    values: list[Any]
    def __contains__(self, member: Any) -> bool:
        ...
    


class Choices(enum.Enum, metaclass=ChoicesMeta):
    @property
    def label(self) -> str:
        ...
    
    @enum_property
    def value(self) -> Any:
        ...
    
    @property
    def do_not_call_in_templates(self) -> bool:
        ...
    


class _IntegerChoicesMeta(ChoicesMeta):
    names: list[str]
    choices: list[tuple[int, str]]
    labels: list[str]
    values: list[int]
    ...


class IntegerChoices(int, Choices, metaclass=_IntegerChoicesMeta):
    @enum_property
    def value(self) -> int:
        ...
    


class _TextChoicesMeta(ChoicesMeta):
    names: list[str]
    choices: list[tuple[str, str]]
    labels: list[str]
    values: list[str]
    ...


class TextChoices(str, Choices, metaclass=_TextChoicesMeta):
    @enum_property
    def value(self) -> str:
        ...
    


