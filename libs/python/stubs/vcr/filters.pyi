from .util import CaseInsensitiveDict as CaseInsensitiveDict

def replace_headers(request, replacements): ...
def remove_headers(request, headers_to_remove): ...
def replace_query_parameters(request, replacements): ...
def remove_query_parameters(request, query_parameters_to_remove): ...
def replace_post_data_parameters(request, replacements): ...
def remove_post_data_parameters(request, post_data_parameters_to_remove): ...
def decode_response(response): ...
