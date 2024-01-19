from typing import Generic, List, TypeVar

import strawberry

T = TypeVar("T")


@strawberry.type
class PageInfo:
    has_next_page: bool
    has_previous_page: bool


@strawberry.type
class PaginatedResponse(Generic[T]):
    items: List[T]
    page_info: PageInfo
    total_count: int
