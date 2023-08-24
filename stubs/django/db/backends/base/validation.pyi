"""
This type stub file was generated by pyright.
"""

from typing import Any
from django.db.backends.base.base import BaseDatabaseWrapper
from django.db.models.fields import Field

"""
This type stub file was generated by pyright.
"""
class BaseDatabaseValidation:
    connection: BaseDatabaseWrapper
    def __init__(self, connection: BaseDatabaseWrapper) -> None:
        ...
    
    def check(self, **kwargs: Any) -> list[Any]:
        ...
    
    def check_field(self, field: Field, **kwargs: Any) -> list[Any]:
        ...
    


