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
    if pagination is None:
        pagination = OffsetPaginationInput(offset=0, limit=max_limit)

    # Adjusting the limit to fetch one extra item
    adjusted_limit = min(max(pagination.limit, 1), max_limit) + 1
    pagination.limit = adjusted_limit

    # Apply pagination
    paginated_items = list(apply(pagination, queryset))

    # Determine if there is a next page
    has_next_page = len(paginated_items) > pagination.limit - 1
    items = (
        paginated_items[: pagination.limit - 1] if has_next_page else paginated_items
    )

    return PaginatedResponse(
        items=items,
        page_info=PageInfo(
            has_next_page=has_next_page, has_previous_page=pagination.offset > 0
        ),
    )
