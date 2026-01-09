from graphql import GraphQLError


class APIErrorCodes:
    UNAUTHENTICATED = "UNAUTHENTICATED"
    NOT_FOUND = "NOT_FOUND"
    HMIS_ENTITY_NOT_FOUND = "HMIS_ENTITY_NOT_FOUND"
    # UNPROCESSABLE_ENTITY = "UNPROCESSABLE_ENTITY" ...


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
    error_code = APIErrorCodes.NOT_FOUND

    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "Not Found.",
            extensions={
                "code": self.error_code,
                "http": {"status": 404},
            },
        )


class HmisNotFoundGQLError(NotFoundGQLError):
    error_code = APIErrorCodes.HMIS_ENTITY_NOT_FOUND
