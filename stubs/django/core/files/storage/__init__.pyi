"""
This type stub file was generated by pyright.
"""

from django.utils.functional import LazyObject
from .base import Storage
from .filesystem import FileSystemStorage
from .handler import InvalidStorageError, StorageHandler
from .memory import InMemoryStorage

"""
This type stub file was generated by pyright.
"""
__all__ = ("FileSystemStorage", "InMemoryStorage", "Storage", "DefaultStorage", "default_storage", "get_storage_class", "InvalidStorageError", "StorageHandler", "storages")
GET_STORAGE_CLASS_DEPRECATED_MSG: str
def get_storage_class(import_path: str | None = ...) -> type[Storage]:
    ...

class DefaultStorage(LazyObject):
    ...


storages: StorageHandler
default_storage: DefaultStorage
