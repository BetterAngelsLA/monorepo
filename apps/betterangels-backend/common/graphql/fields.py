from typing import Optional

from django.db.models import QuerySet


class CustomStrawberryDjangoField:
    # @override
    def apply_pagination(
        self,
        queryset: QuerySet,
        pagination: Optional[object] = None,
    ) -> QuerySet:
        # apply_pagination is overriden to store the non-paginated queryset
        # originally it can be found in StrawberryDjangoPagination
        self.non_paginated_qset = queryset.all()
        paginated_qset = super().apply_pagination(queryset, pagination)
        paginated_qset = paginated_qset.all()
        return paginated_qset

    def get_result(self, source, info, args, kwargs):
        qset_result = cast(QuerySet, super().get_result(source, info, args, kwargs))
        self.paginated_qset = qset_result
        # This is the custom behavior where we add the `totalCount` metadata to our query results
        return self.result_formatter.format_result(self.non_paginated_qset, self.paginated_qset)
