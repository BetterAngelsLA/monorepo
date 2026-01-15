from graphql import GraphQLError


class APIErrorCodes:
    UNAUTHENTICATED = "UNAUTHENTICATED"
    NOT_FOUND = "NOT_FOUND"
    HMIS_TOKEN_EXPIRED = "HMIS_TOKEN_EXPIRED"


class UnauthenticatedGQLError(GraphQLError):
    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "You must be logged in to perform this action.",
            extensions={
                "code": APIErrorCodes.UNAUTHENTICATED,
                "http": {"status": 401},
            },
        )


class HmisTokenExpiredError(GraphQLError):
    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "HMIS token expired. Please refresh the token.",
            extensions={
                "code": APIErrorCodes.HMIS_TOKEN_EXPIRED,
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
