from graphql import GraphQLError


class APIErrorCodes:
    UNAUTHENTICATED = "UNAUTHENTICATED"


class UnauthenticatedGQLError(GraphQLError):
    def __init__(self, message: str | None = None) -> None:
        super().__init__(
            message or "You must be logged in to perform this action.",
            extensions={
                "code": APIErrorCodes.UNAUTHENTICATED,
                "http": {"status": 401},
            },
        )
