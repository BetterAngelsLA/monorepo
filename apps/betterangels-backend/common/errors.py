from graphql import GraphQLError
from typing import TypeVar

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Model, QuerySet

_M = TypeVar("_M", bound=Model)


class APIErrorCodes:
    UNAUTHENTICATED = "UNAUTHENTICATED"
    NOT_FOUND = "NOT_FOUND"


class UnauthenticatedGQLError(GraphQLError):
    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "You must be logged in to perform this action.",
            extensions={
                "code": APIErrorCodes.UNAUTHENTICATED,
                "http": {"status": 401},
            },
        )


class NotFoundGQLError(GraphQLError):
    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "Not Found.",
            extensions={
                "code": APIErrorCodes.NOT_FOUND,
                "http": {"status": 404},
            },
        )


def get_by_pk_or_not_found(queryset: QuerySet[_M], pk: int | str) -> _M:
    """Get an object by primary key, raising ObjectDoesNotExist on failure.

    Uses ``queryset.model.__name__`` to build a descriptive error message.
    """
    obj = queryset.filter(pk=pk).first()
    if obj is None:
        raise ObjectDoesNotExist(
            f"{queryset.model.__name__} matching ID {pk} could not be found."
        )
    return obj
