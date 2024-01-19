from typing import Optional

from common.graphql.types import PageInfo, PaginatedResponse
from django.db.models import QuerySet
from strawberry_django.pagination import OffsetPaginationInput, apply


def paginate_queryset(
    queryset: QuerySet,
    pagination: Optional[OffsetPaginationInput],
    max_limit: int = 100,
) -> PaginatedResponse:
    """
    A generic function to apply pagination to a queryset.

    Args:
        queryset: The queryset to paginate.
        pagination: Pagination parameters.
        max_limit: The maximum limit for pagination.

    Returns:
        PaginatedResponse: A paginated response with items.
    """
    pagination = pagination or OffsetPaginationInput(offset=0, limit=max_limit)
    pagination.limit = min(max(pagination.limit, 0), max_limit)

    paginated_items = apply(pagination, queryset)
    items_count = queryset.count()
    has_next_page = (pagination.offset + pagination.limit) < items_count
    has_previous_page = pagination.offset > 0

    return PaginatedResponse(
        items=paginated_items,
        page_info=PageInfo(
            has_next_page=has_next_page, has_previous_page=has_previous_page
        ),
        total_count=items_count,
    )
