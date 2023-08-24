"""
This type stub file was generated by pyright.
"""

from typing import Any
from django.db.models.base import Model

"""
This type stub file was generated by pyright.
"""
NOT_PROVIDED: Any
class FieldCacheMixin:
    def get_cache_name(self) -> str:
        ...
    
    def get_cached_value(self, instance: Model, default: Any = ...) -> Model | None:
        ...
    
    def is_cached(self, instance: Model) -> bool:
        ...
    
    def set_cached_value(self, instance: Model, value: Model | None) -> None:
        ...
    
    def delete_cached_value(self, instance: Model) -> None:
        ...
    


class CheckFieldDefaultMixin:
    def check(self, **kwargs: Any) -> Any:
        ...
    


