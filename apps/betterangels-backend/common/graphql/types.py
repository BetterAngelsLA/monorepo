import strawberry


@strawberry.input
class DeleteDjangoObjectInput:
    id: strawberry.ID
