from . import filters as filters, matchers as matchers
from .cassette import Cassette as Cassette
from .persisters.filesystem import FilesystemPersister as FilesystemPersister
from .record_mode import RecordMode as RecordMode
from .serializers import jsonserializer as jsonserializer, yamlserializer as yamlserializer
from .util import auto_decorate as auto_decorate, compose as compose
from _typeshed import Incomplete

class VCR:
    @staticmethod
    def is_test_method(method_name, function): ...
    @staticmethod
    def ensure_suffix(suffix): ...
    serializer: Incomplete
    match_on: Incomplete
    cassette_library_dir: Incomplete
    serializers: Incomplete
    matchers: Incomplete
    persister: Incomplete
    record_mode: Incomplete
    filter_headers: Incomplete
    filter_query_parameters: Incomplete
    filter_post_data_parameters: Incomplete
    before_record_request: Incomplete
    before_record_response: Incomplete
    ignore_hosts: Incomplete
    ignore_localhost: Incomplete
    inject_cassette: Incomplete
    path_transformer: Incomplete
    func_path_generator: Incomplete
    decode_compressed_response: Incomplete
    record_on_exception: Incomplete
    def __init__(self, path_transformer: Incomplete | None = ..., before_record_request: Incomplete | None = ..., custom_patches=..., filter_query_parameters=..., ignore_hosts=..., record_mode=..., ignore_localhost: bool = ..., filter_headers=..., before_record_response: Incomplete | None = ..., filter_post_data_parameters=..., match_on=..., before_record: Incomplete | None = ..., inject_cassette: bool = ..., serializer: str = ..., cassette_library_dir: Incomplete | None = ..., func_path_generator: Incomplete | None = ..., decode_compressed_response: bool = ..., record_on_exception: bool = ...) -> None: ...
    def use_cassette(self, path: Incomplete | None = ..., **kwargs): ...
    def get_merged_config(self, **kwargs): ...
    def register_serializer(self, name, serializer) -> None: ...
    def register_matcher(self, name, matcher) -> None: ...
    def register_persister(self, persister) -> None: ...
    def test_case(self, predicate: Incomplete | None = ...): ...
